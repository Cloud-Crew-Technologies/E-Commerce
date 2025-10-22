import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ProductCard from "@/components/products/product-card";
import AddProductDialog from "@/components/products/add-product-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  Box,
  Collapse,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Typography,
  Slider,
} from "@mui/material";

export default function Products() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [products, setProduct] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [types, setTypes] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    types: "all",
    priceRange: [0, 10000],
    sortBy: "",
    stockLevel: "all", // 'all', 'no-stock', 'low-stock', 'full-stock'
  });

  const { toast } = useToast();

  // // const { data: products, isLoading } = useQuery({ queryKey: ["/api/products/get", { search, category }] })
  // const { data: categoriesData } = useQuery({ queryKey: ["/api/categories/get"] })

  useEffect(() => {
    fetchCategories();
    fetchCategoriesData();
    fetchTypes();
  }, []);
  const fetchTypes = async () => {
    try {
      setIsLoadingTypes(true);
      const response = await axios.get("https://shisecommerce.skillhiveinnovations.com/api/types/get");

      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        setTypes(response.data.data);
      } else if (Array.isArray(response.data)) {
        setTypes(response.data);
      } else {
        setTypes([]);
      }
    } catch (error) {
      console.error("Failed to fetch types:", error);
      setTypes([]);
      toast({
        title: "Error",
        description: "Failed to load types. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTypes(false);
    }
  };
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "https://shisecommerce.skillhiveinnovations.com/api/products/get"
      );

      // Ensure we set an array - handle different response structures
      const categoryData = response.data;
      if (Array.isArray(categoryData)) {
        setProduct(categoryData);
      } else if (categoryData && Array.isArray(categoryData.data)) {
        setProduct(categoryData.data);
      } else {
        console.warn("Unexpected response structure:", categoryData);
        setProduct([]);
      }
    } catch (error) {
      console.error("Error fetching Products:", error);
      setProduct([]);
      toast({
        title: "Error",
        description: "Failed to load Products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoriesData = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };
  console.log(categoriesData);
  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => {
      await apiRequest("DELETE", `/api/products/delete/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "Product has been successfully deleted.",
      });
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const maxPrice = Math.max(
    ...products.map((product) => product.rprice || 0),
    10000
  );
  const categories = categoriesData?.map((c) => c.name) || ["Other"];
  const type = types?.map((c) => c.name) || ["Other"];

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchesCategory =
      filters.category === "all" || product.category === filters.category;
    const matchesTypes =
      filters.types === "all" || product.type === filters.types;
    const matchesPrice =
      product.rprice >= filters.priceRange[0] &&
      product.rprice <= filters.priceRange[1];

    // Stock level filtering
    const stockLevel = product.quantity || 0;
    const matchesStockLevel =
      filters.stockLevel === "all" ||
      (filters.stockLevel === "no-stock" && stockLevel < 1) ||
      (filters.stockLevel === "low-stock" &&
        stockLevel >= 1 &&
        stockLevel <= 10) ||
      (filters.stockLevel === "full-stock" && stockLevel > 10);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesPrice &&
      matchesStockLevel &&
      matchesTypes
    );
  });

  const stock = filteredProducts?.reduce((acc, product) => {
    return acc + (product.stock || 0);
  }, 0);

  // Sort products after filtering
  const sortedProducts = [...(filteredProducts || [])].sort((a, b) => {
    switch (filters.sortBy) {
      case "default":
        return 0;
      case "price-low":
        return a.rprice - b.rprice;
      case "price-high":
        return b.rprice - a.rprice;
      case "name":
        return a.name.localeCompare(b.name);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "all",
      types: "all",
      priceRange: [0, maxPrice],
      sortBy: "",
      stockLevel: "all",
    });
  };

  return (
    <div className=" bg-grey-50">
        <Sidebar />
      <div className="ml-14 flex-1">
        <Header
          title="Product Management"
          subtitle="Manage your store inventory"
        />
        <main className="p-6">
          <div className="bg-white rounded-lg material-elevation-2 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-grey-900">
                All Products
              </h3>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-primary-500 hover:bg-primary-600 text-white"
              >
                <span className="material-icons mr-2">add</span>
                Add Product
              </Button>
            </div>

            <div className="flex flex-col  gap-4 mb-6 w-50%">
              <div className="flex-1 relative w-50%">
                <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-400">
                  search
                </span>
                <Input
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    setFilters({ ...filters, category: value })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((catName) => (
                      <SelectItem key={catName} value={catName}>
                        {catName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.types}
                  onValueChange={(value) =>
                    setFilters({ ...filters, types: value })
                  }
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {type.map((typName) => (
                      <SelectItem key={typName} value={typName}>
                        {typName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) =>
                    setFilters({ ...filters, sortBy: value })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="price-low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-high">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.stockLevel}
                  onValueChange={(value) =>
                    setFilters({ ...filters, stockLevel: value })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Stock Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock Levels</SelectItem>
                    <SelectItem value="no-stock">Out of Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock (≤10)</SelectItem>
                    <SelectItem value="full-stock">
                      Full Stock (&gt;10)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-align-right">
                  <Button
                    variant="outline"
                    onClick={() => clearFilters()}
                    className="flex items-right gap-1"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredProducts?.length} of {products?.length}{" "}
                products
              </Typography>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-grey-50 rounded-lg p-4">
                    <Skeleton className="w-full h-32 rounded-lg mb-3" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-2" />
                    <div className="flex justify-between items-center mb-3">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="bg-white p-2 rounded border mb-3">
                      <Skeleton className="h-3 w-12 mb-1" />
                      <Skeleton className="h-6 w-full mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3  gap-6">
                {sortedProducts?.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onDelete={() => deleteProductMutation.mutate(product._id)}
                    onEdit={product.id}
                  />
                ))}
                {(!filteredProducts || filteredProducts.length === 0) && (
                  <div className="col-span-full text-center py-12">
                    <span className="material-icons text-6xl text-grey-400 mb-4 block">
                      inventory_2
                    </span>
                    <p className="text-grey-500 text-lg mb-2">
                      No products found
                    </p>
                    <p className="text-grey-400">
                      {filters.search || filters.category !== "all"
                        ? "Try adjusting your search criteria"
                        : "Add your first product to get started"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
