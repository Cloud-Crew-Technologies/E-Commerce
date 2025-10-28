import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import ViewProduct from "@/components/products/productdetalis";

// Utility to compute default expiry date (+60 days)
function computeDefaultExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 60);
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function CreateBatch() {
  const { toast } = useToast();
  const [expiryDates, setExpiryDates] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Step 1
  const [batch, setBatch] = useState("");
  const [step, setStep] = useState(1);

  // Step 2
  const [products, setProducts] = useState([]);
  const [selectedMap, setSelectedMap] = useState({});

  // Step 3 modal
  const [openConfirm, setOpenConfirm] = useState(false);

  const selectedProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return list
      .filter((p) => selectedMap[p._id]?.selected)
      .map((p) => {
        // Use expiry date from confirmation dialog if available, otherwise use the one from selectedMap
        const finalExpiryDate = expiryDates[p._id] || selectedMap[p._id]?.expiryDate || computeDefaultExpiryDate();
        
        return {
          ...p,
          quantity: Number(selectedMap[p._id]?.qty || 0),
          expiryDate: finalExpiryDate,
        };
      });
  }, [products, selectedMap, expiryDates]);

  const totalSelected = selectedProducts.length;
  const today = new Date();
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 2);

  useEffect(() => {
    if (step === 2) {
      setIsLoadingProducts(true);
      axios
        .get("https://saiapi.skillhiveinnovations.com/api/products/get")
        .then((res) => res.data)
        .then((data) => {
          const list = Array.isArray(data?.products?.data)
            ? data.products.data
            : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
            ? data
            : [];
          setProducts(list || []);
          const defaults = {};
          (list || []).forEach((p) => {
            defaults[p._id] = {
              selected: false,
              qty: 0,
              expiryDate: computeDefaultExpiryDate(),
            };
          });
          setSelectedMap(defaults);
        })
        .catch(() => {
          toast({ title: "Failed to load products", variant: "destructive" });
        })
        .finally(() => {
          setIsLoadingProducts(false);
        });
    }
  }, [step, toast]);

  const handleCreateOrAddClick = () => {
    if (!batch.trim()) {
      toast({ title: "Enter a batch name", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleToggleSelect = (id, checked) => {
    setSelectedMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], selected: checked },
    }));
  };

  const handleQtyChange = (id, value) => {
    const qty = Number(value || 0);
    setSelectedMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], qty },
    }));
  };

  const handleExpiryChange = (id, newDate) => {
    setExpiryDates((prev) => ({ ...prev, [id]: newDate }));
  };

  const handleDateChange = (id, value) => {
    setSelectedMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], expiryDate: value },
    }));
  };

  const openSummary = () => {
    if (!totalSelected) {
      toast({ title: "Select at least one product", variant: "destructive" });
      return;
    }
    
    // Initialize expiry dates with current selectedMap values
    const initialExpiryDates = {};
    selectedProducts.forEach((p) => {
      initialExpiryDates[p._id] = selectedMap[p._id]?.expiryDate || computeDefaultExpiryDate();
    });
    setExpiryDates(initialExpiryDates);
    
    setOpenConfirm(true);
  };

  const postBatch = async () => {
    setIsLoading(true);
    try {
      const payload = {
        batch,
        products: selectedProducts.map((p) => {
          // Parse weight and unit if weightUnit/weightValue are missing
          let weightUnit = p.weightUnit;
          let weightValue = p.weightValue;
          
          if (!weightUnit || !weightValue) {
            // Try to parse from weight field (e.g., "100 g", "500 ml")
            if (p.weight && typeof p.weight === 'string') {
              const parts = p.weight.split(' ');
              if (parts.length >= 2) {
                const value = parseFloat(parts[0]);
                const unit = parts[1];
                weightUnit = unit;
                // Set default weightValue based on unit
                if (unit === 'kg' || unit === 'g' || unit === 'mg') {
                  weightValue = unit === 'kg' ? value : unit === 'g' ? value / 1000 : value / 1000000;
                } else if (unit === 'l' || unit === 'ml') {
                  weightValue = unit === 'l' ? value : value / 1000;
                }
              }
            }
          }
          
          return {
            name: p.name,
            productID: p.productID,
            expiryDate: p.expiryDate,
            description: p.description,
            benefits: p.benefits,
            rprice: p.rprice,
            wprice: p.wprice,
            quantity: p.quantity,
            category: p.category,
            type: p.type,
            weight: p.weight,
            weightUnit: weightUnit || 'kg', // Default to kg if not specified
            weightValue: weightValue || 0, // Default to 0 if not specified
            batchID: batch,
            isActive: p.isActive ?? true,
            lowstock: p.lowstock,
          };
        }),
      };
      console.log(payload);
      await axios.post("https://saiapi.skillhiveinnovations.com/api/rbatch/create", payload);
      await axios.post("https://saiapi.skillhiveinnovations.com/api/batch/create", payload);
      toast({ title: "Stock added successfully" });
      setOpenConfirm(false);
      setStep(1);
      setProducts([]);
      setSelectedMap({});
      window.location.reload();
    } catch (e) {
      // Check for duplicate key error (MongoDB E11000)
      const errorData = e.response?.data;
      const isDuplicateError = 
        errorData?.code === 11000 || 
        errorData?.message?.code === 11000 ||
        errorData?.errmsg?.includes('E11000') ||
        errorData?.message?.errmsg?.includes('E11000');
      
      if (isDuplicateError) {
        window.alert(`Batch is already created with this ID: ${batch}`);
        toast({ 
          title: "Batch already exists", 
          description: `A batch with ID "${batch}" has already been created. Please use a different batch ID.`,
          variant: "destructive" 
        });
      } else {
        toast({ title: "Failed to add stock", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };
  const edit = (id) => {
    setIsAddDialogOpen(true);
    setEditProductId(id);
    console.log(id);
    console.log("s", editProductId);
  };

  return (
    <div className=" bg-grey-50">
      <Sidebar />
      <div className="ml-14">
        <Header>Create Batch</Header>

        <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle> Create or Add Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Batch</label>
                  <Input
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="Enter batch name"
                  />
                </div>
                <Button onClick={handleCreateOrAddClick} disabled={isLoadingProducts}>
                  {isLoadingProducts ? "Loading..." : "Create / Add Stocks"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {step >= 2 && (
            <Card>
              <div className="flex justify-between items-center mt-4 mb-2 px-4">
                <div className="text-sm text-grey-600">
                  Selected: {totalSelected}
                </div>
                <div className="flex gap-2">
                  <Button onClick={openSummary}>Confirm Selection</Button>
                </div>
              </div>
              <CardHeader>
                <CardTitle>Select products for batch "{batch}"</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-center">Category</TableHead>
                        <TableHead className="text-center">Type</TableHead>
                        <TableHead className="text-center">
                          Retail Price
                        </TableHead>
                        <TableHead className="text-center">
                          Wholesale Price
                        </TableHead>
                        <TableHead className="w-22 text-center">Qty</TableHead>
                        <TableHead className="text-center">Expiry</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p) => {
                        const state = selectedMap[p._id] || {};
                        return (
                          <TableRow key={p._id}>
                            <TableCell>
                              <Checkbox
                                checked={!!state.selected}
                                onCheckedChange={(v) =>
                                  handleToggleSelect(p._id, !!v)
                                }
                              />
                            </TableCell>
                            <TableCell>{p.name}</TableCell>
                            <TableCell className="text-center">
                              {p.category}
                            </TableCell>
                            <TableCell className="text-center">
                              {p.type}
                            </TableCell>
                            <TableCell className="text-center">
                              {"₹ "}
                              {p.rprice}
                            </TableCell>
                            <TableCell className="text-center">
                              {"₹ "}
                              {p.wprice}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={state.qty ?? 0}
                                onChange={(e) =>
                                  handleQtyChange(p._id, e.target.value)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={
                                  state.expiryDate || computeDefaultExpiryDate()
                                }
                                onChange={(e) =>
                                  handleDateChange(p._id, e.target.value)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                onClick={() => edit(p?._id || p?.id)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Confirm products</DialogTitle>
              </DialogHeader>
              <div className="max-h-[50vh] overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Creation Date</TableHead>
                      <TableHead>No of Days</TableHead>
                      <TableHead>Expiry Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProducts.map((p) => {
                      const today = new Date();
                      const expiryDateStr = expiryDates[p._id];
                      const expiry = expiryDateStr
                        ? new Date(expiryDateStr)
                        : (() => {
                            let date = new Date();
                            date.setMonth(date.getMonth() + 2);
                            return date;
                          })();

                      return (
                        <TableRow key={p._id}>
                          <TableCell className="font-medium">
                            {p.name}
                          </TableCell>
                          <TableCell>{p.quantity}</TableCell>
                          <TableCell>{today.toLocaleDateString()}</TableCell>
                          <TableCell>
                            {Math.round(
                              (expiry - today) / (1000 * 60 * 60 * 24)
                            )}
                          </TableCell>
                          <TableCell>
                            <input
                              type="date"
                              value={expiryDateStr}
                              onChange={(e) =>
                                handleExpiryChange(p._id, e.target.value)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => setOpenConfirm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={postBatch} disabled={isLoading}>
                  {isLoading ? "Adding Stock..." : "Add Stock"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ViewProduct
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        productId={editProductId}
      />
    </div>
  );
}
