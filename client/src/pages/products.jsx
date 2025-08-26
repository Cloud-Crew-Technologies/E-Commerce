import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import ProductCard from "@/components/products/product-card"
import AddProductDialog from "@/components/products/add-product-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"

export default function Products() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [products,setProduct] = useState([])
  const [isLoading,setIsLoading] = useState(false)

  const { toast } = useToast()

  // const { data: products, isLoading } = useQuery({ queryKey: ["/api/products/get", { search, category }] })
  const { data: categoriesData } = useQuery({ queryKey: ["/api/categories/get"] })

  useEffect(() => {
    fetchCategories();
  }, [100]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "http://localhost:3000/api/products/get"
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

  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => {
      await apiRequest("DELETE", `/api/products/${productId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] })
      toast({
        title: "Product deleted",
        description: "Product has been successfully deleted.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const categories = categoriesData?.map((c) => c.name) || ["Other"]

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === "all" || product.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header title="Product Management" subtitle="Manage your store inventory" />
        <main className="p-6">
          <div className="bg-white rounded-lg material-elevation-2 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-grey-900">All Products</h3>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary-500 hover:bg-primary-600 text-white">
                <span className="material-icons mr-2">add</span>
                Add Product
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-400">search</span>
                <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2">
                 <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
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
                <Button variant="outline" size="icon">
                  <span className="material-icons">filter_list</span>
                </Button>
              </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts?.map((product) => (
                  <ProductCard key={product.id} product={product} onDelete={(id) => deleteProductMutation.mutate(id)} onEdit={() => {}} />
                ))}
                {(!filteredProducts || filteredProducts.length === 0) && (
                  <div className="col-span-full text-center py-12">
                    <span className="material-icons text-6xl text-grey-400 mb-4 block">inventory_2</span>
                    <p className="text-grey-500 text-lg mb-2">No products found</p>
                    <p className="text-grey-400">{search || category !== "all" ? "Try adjusting your search criteria" : "Add your first product to get started"}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      <AddProductDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  )
}