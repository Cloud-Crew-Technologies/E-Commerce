import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { useState, useEffect } from "react";

export default function AddCouponDialog({ open, onOpenChange }) {
  const { toast } = useToast();
  const [offerType, setOfferType] = useState("discount");
  const [products, setProducts] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "https://texapi.skillhiveinnovations.com/api/products/get"
        );
        const payload = response?.data;
        const list = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.products)
          ? payload.products
          : [];
        if (Array.isArray(list)) {
          setProducts(list);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "Failed to load products.",
          variant: "destructive",
        });
      }
    };
    fetchProducts();
  }, [toast]);

  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
      discount: 0,
      usageLimit: 100,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      offerType: "discount",
      buyProduct: "",
      buyProductQuantity: 0,
      getProduct: "",
      getProductQuantity: 0,
      buyabove: 0,
      productID: "",
      discountProduct: "Any",
    },
  });

  useEffect(() => {
    form.setValue("offerType", offerType);
  }, [offerType, form]);

  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      const current = form.getValues("productID");
      if (!current) {
        form.setValue("productID", products[0]?.productID || "");
      }
    }
  }, [products, form]);

  const addCouponMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append("code", String(data.code || ""));
      formData.append("name", String(data.name || ""));
      formData.append("productID", String(data.productID || ""));
      formData.append("offerType", String(data.offerType || offerType));
      formData.append("isActive", String(Boolean(data.isActive)));

      if (data.offerType === "discount") {
        if (data.discount !== undefined && data.discount !== null) {
          formData.append("discount", String(Number(data.discount)));
        }
        if (data.usageLimit !== undefined && data.usageLimit !== null) {
          formData.append("usageLimit", String(Number(data.usageLimit)));
        }
        if (data.buyabove !== undefined && data.buyabove !== null) {
          formData.append("buyabove", String(Number(data.buyabove)));
        }
        if (data.discountProduct) {
          formData.append("discountProduct", String(data.discountProduct));
        }
      }

      if (data.offerType === "product") {
        if (data.buyProduct)
          formData.append("buyProduct", String(data.buyProduct));
        if (
          data.buyProductQuantity !== undefined &&
          data.buyProductQuantity !== null
        ) {
          formData.append(
            "buyProductQuantity",
            String(Number(data.buyProductQuantity))
          );
        }
        if (data.getProduct)
          formData.append("getProduct", String(data.getProduct));
        if (
          data.getProductQuantity !== undefined &&
          data.getProductQuantity !== null
        ) {
          formData.append(
            "getProductQuantity",
            String(Number(data.getProductQuantity))
          );
        }
      }

      if (data.expiryDate) {
        const iso = new Date(data.expiryDate).toISOString();
        formData.append("expiryDate", iso);
      }

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const response = await axios.post(
        "https://texapi.skillhiveinnovations.com/api/coupons/create",
        formData,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons/getall"] });
      toast({
        title: "Offer created",
        description: "Offer has been successfully created.",
      });
      form.reset();
      setImagePreview(null);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      window.location.reload();
    },
  });

  const onSubmit = (data) => {
    console.log("✅ Form submitted with data:", data);
    console.log("Selected file:", selectedFile);
    addCouponMutation.mutate(data);
  };

  const onError = (errors) => {
    console.log("❌ Form validation errors:", errors);
  };

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.log("Form values:", value);
      console.log("Form errors:", form.formState.errors);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 sm:p-8">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <span className="material-icons text-white text-3xl">
                  local_offer
                </span>
              </div>
              <div>
                <DialogTitle className="text-2xl sm:text-3xl font-bold text-white">
                  Create New Offer
                </DialogTitle>
                <DialogDescription className="text-blue-100 text-sm sm:text-base mt-1">
                  Create attractive offers to boost your sales
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">
                  Select Offer Type
                </Label>
                <RadioGroup
                  value={offerType}
                  onValueChange={setOfferType}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="discount"
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      offerType === "discount"
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    <RadioGroupItem
                      value="discount"
                      id="discount"
                      className="mt-0"
                    />
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-blue-600">
                        percent
                      </span>
                      <div>
                        <div className="font-semibold">Discount Offer</div>
                        <div className="text-xs text-gray-500">
                          Percentage off on total
                        </div>
                      </div>
                    </div>
                  </Label>
                  <Label
                    htmlFor="product"
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      offerType === "product"
                        ? "border-purple-500 bg-purple-50 shadow-md"
                        : "border-gray-200 hover:border-purple-300 hover:shadow-sm"
                    }`}
                  >
                    <RadioGroupItem
                      value="product"
                      id="product"
                      className="mt-0"
                    />
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-purple-600">
                        card_giftcard
                      </span>
                      <div>
                        <div className="font-semibold">Product Offer</div>
                        <div className="text-xs text-gray-500">
                          Buy X Get Y free
                        </div>
                      </div>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-semibold">
                        <span className="material-icons text-sm">tag</span>
                        Offer Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., SAVE20"
                          className="font-mono text-lg h-12"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-semibold">
                        <span className="material-icons text-sm">label</span>
                        Offer Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Summer Sale"
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-semibold">
                        <span className="material-icons text-sm">
                          toggle_on
                        </span>
                        Active Status
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "true")
                          }
                          defaultValue={field.value.toString()}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {offerType === "discount" && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-200">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-semibold">
                            <span className="material-icons text-sm text-blue-600">
                              percent
                            </span>
                            Discount Percentage
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              placeholder="20"
                              className="h-12 text-lg"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="usageLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-semibold">
                            <span className="material-icons text-sm text-blue-600">
                              groups
                            </span>
                            Usage Limit
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="100"
                              className="h-12 text-lg"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="buyabove"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-semibold">
                            <span className="material-icons text-sm text-blue-600">
                              shopping_cart
                            </span>
                            Buy Above Amount
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="500"
                              className="h-12 text-lg"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discountProduct"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-semibold">
                            <span className="material-icons text-sm text-blue-600">
                              inventory_2
                            </span>
                            Apply Discount To
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || "Any"}
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Any">Any Product</SelectItem>
                                {products.map((product) => (
                                  <SelectItem
                                    key={product._id}
                                    value={product.productID}
                                  >
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {offerType === "product" && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-green-800">
                      <span className="material-icons">shopping_cart</span>
                      Buy Product
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="buyProduct"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              Product
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                              </FormControl>

                              <SelectContent>
                                <SelectItem value="Any">Any</SelectItem>
                                {products.map((product) => (
                                  <SelectItem
                                    key={product._id}
                                    value={product.productID}
                                  >
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="buyProductQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              Quantity
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                className="h-12 text-lg"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-200">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-purple-800">
                      <span className="material-icons">card_giftcard</span>
                      Get Product (Free)
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="getProduct"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              Product
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem
                                    key={product._id}
                                    value={product.productID}
                                  >
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="getProductQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              Quantity
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                className="h-12 text-lg"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-semibold text-gray-700">
                  <span className="material-icons text-sm">image</span>
                  Offer Banner (Optional)
                </Label>
                <div className="relative">
                  <Input
                    id="offer-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <Label
                    htmlFor="offer-image"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all overflow-hidden"
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-semibold">
                            Click to change
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <span className="material-icons text-6xl text-gray-400 mb-3">
                          cloud_upload
                        </span>
                        <p className="text-sm font-semibold text-gray-700">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          PNG, JPG or GIF (Recommended: 800x400px)
                        </p>
                      </div>
                    )}
                  </Label>
                </div>
              </div>

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-semibold">
                      <span className="material-icons text-sm">event</span>
                      Expiry Date
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="h-12"
                        {...field}
                        value={
                          field.value
                            ? new Date(field.value).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 sm:flex-none h-12 text-base"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addCouponMutation.isPending}
                  className="flex-1 sm:flex-none h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {addCouponMutation.isPending ? (
                    <>
                      <span className="material-icons mr-2 animate-spin">
                        refresh
                      </span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="material-icons mr-2">add_circle</span>
                      Create Offer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
