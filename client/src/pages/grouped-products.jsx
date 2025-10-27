import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

export default function GroupedProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fetchedTypes, setFetchedTypes] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [categoriesData, setCategoriesData] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const { toast } = useToast();

  // Fetch all initial data: products, types, categories
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "https://shisecommerce.skillhiveinnovations.com/api/batch/get"
        );
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products", error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTypes = async () => {
      try {
        setIsLoadingTypes(true);
        const response = await axios.get(
          "https://shisecommerce.skillhiveinnovations.com/api/types/get"
        );
        if (
          response.data &&
          response.data.success &&
          Array.isArray(response.data.data)
        ) {
          setFetchedTypes(response.data.data);
        } else if (Array.isArray(response.data)) {
          setFetchedTypes(response.data);
        } else {
          setFetchedTypes([]);
        }
      } catch (error) {
        console.error("Failed to fetch types:", error);
        setFetchedTypes([]);
        toast({
          title: "Error",
          description: "Failed to load types. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTypes(false);
      }
    };

    const fetchCategoriesData = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await axios.get(
          "https://shisecommerce.skillhiveinnovations.com/api/categories/get"
        );
        const categoryData = response.data;
        if (Array.isArray(categoryData)) {
          setCategoriesData(categoryData);
        } else if (categoryData && Array.isArray(categoryData.data)) {
          setCategoriesData(categoryData.data);
        } else {
          console.warn("Unexpected response structure:", categoryData);
          setCategoriesData([]);
        }
      } catch (error) {
        console.error("Error fetching Categories:", error);
        setCategoriesData([]);
        toast({
          title: "Error",
          description: "Failed to load Categories",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchProducts();
    fetchTypes();
    fetchCategoriesData();
  }, [toast]);

  // Use categories from fetched categories data for filter options
  const categories = useMemo(() => {
    return categoriesData
      .map((cat) => (typeof cat === "string" ? cat : cat.name))
      .filter(Boolean);
  }, [categoriesData]);

  // Use types from fetched types for filter options
  const types = useMemo(() => {
    return fetchedTypes
      .map((t) => (typeof t === "string" ? t : t.name))
      .filter(Boolean);
  }, [fetchedTypes]);
  console.log("done");

  // Filter batches' products based on search, category, and type filters
  const filtered = useMemo(() => {
    // Flatten all products from batches
    let allProducts = [];
    for (const batchGroup of products) {
      const batchProducts = batchGroup.products || [];
      allProducts = allProducts.concat(batchProducts);
    }

    return allProducts.filter((p) => {
      const matchesSearch = (p.name || "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || p.category === categoryFilter;
      const candidateType = p.type || p.productType || p?.typeName;
      const matchesType = typeFilter === "all" || candidateType === typeFilter;
      return (
        matchesSearch && matchesCategory && matchesType && p.isActive !== false
      );
    });
  }, [products, search, categoryFilter, typeFilter]);

  //logic change
  // Helper functions for stock status
  const getStockStatus = (product) => {
    const quantity = product.quantity || 0;
    const lowStockThreshold = product.lowstock || 10;
    
    if (quantity === 0) return "Out of Stock";
    if (quantity <= lowStockThreshold) return "Low Stock";
    return "In Stock";
  };

  const getStockVariant = (product) => {
    const quantity = product.quantity || 0;
    const lowStockThreshold = product.lowstock || 10;
    
    if (quantity === 0) return "destructive";
    if (quantity <= lowStockThreshold) return "secondary";
    return "default";
  };

  // Group filtered products by name | category | type with batch count and total stock
  const grouped = useMemo(() => {
    const map = new Map();

    for (const p of filtered) {
      const batchID = p.batchID || p.batch || p._id || "";
      const norm = (v) => String(v).trim().toLowerCase();
      const key = `${norm(p.name)}|${norm(p.category)}|${norm(
        p.type || p.productType || p?.typeName
      )}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          name: p.name || "",
          category: p.category || "",
          type: p.type || p.productType || p?.typeName || "",
          batches: new Set(),
          totalStock: 0,
          lowstock: p.lowstock || 10, // Use the first product's lowstock threshold
        });
      }
      const entry = map.get(key);
      if (batchID) {
        entry.batches.add(batchID.toLowerCase());
      }
      entry.totalStock += Number(p.quantity ?? 0);
    }

    return Array.from(map.values()).map((entry) => ({
      ...entry,
      batchCount: entry.batches.size,
    }));
  }, [filtered]);

  return (
    <div className=" bg-grey-50">
      <Sidebar />
      <div className="ml-14 flex-1">
        <Header
          title="Grouped Products"
          subtitle="Grouped by name, category, and type"
        />
        <main className="p-6">
          <Card className="material-elevation-2">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <div className="mt-4 w-full flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative w-full sm:w-72">
                    <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-400">
                      search
                    </span>
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by product name..."
                      className="pl-10 pr-4"
                    />
                  </div>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                    disabled={isLoadingCategories}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                    disabled={isLoadingTypes}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {types.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Batch Counts</TableHead>
                      <TableHead>Total Stock</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-grey-500 py-8"
                        >
                          No results
                        </TableCell>
                      </TableRow>
                    ) : (
                      grouped.map((g) => (
                        <TableRow key={g.key}>
                          <TableCell>
                            <div className="font-medium text-grey-900">
                              {g.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{g.category || "-"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge>{g.type || "-"}</Badge>
                          </TableCell>
                          <TableCell>{g.batchCount}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {g.totalStock}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStockVariant({quantity: g.totalStock, lowstock: g.lowstock})}>
                              {getStockStatus({quantity: g.totalStock, lowstock: g.lowstock})}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
