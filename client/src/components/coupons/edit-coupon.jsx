import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
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
import { useEffect, useState } from "react";
import axios from "axios";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { insertCouponSchema } from "@shared/schema";

export default function EditCouponDialog({ open, onOpenChange, couponDataID }) {
  const { toast } = useToast();
  const [offerType, setOfferType] = useState("discount");
  const [products, setProducts] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "https://saiapi.skillhiveinnovations.com/api/products/get"
        );
        console.log("Products API response:", response.data);
        
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          setProducts(response.data.data);
        } else if (response.data && Array.isArray(response.data.products)) {
          setProducts(response.data.products);
        } else if (Array.isArray(response.data)) {
          setProducts(response.data);
        } else {
          console.warn("Unexpected products response structure:", response.data);
          setProducts([]);
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
    },
  });

  useEffect(() => {
    form.setValue("offerType", offerType);
  }, [offerType, form]);

  useEffect(() => {
    const fetchCouponDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://saiapi.skillhiveinnovations.com/api/coupons/get/${couponDataID}`
        );

        if (response.data && response.data.data) {
          const couponData = response.data.data;
          console.log("Fetched coupon data:", couponData);
          
          setOfferType(couponData.offerType || "discount");
          
          // Set image preview if imageUrl exists
          if (couponData.imageUrl) {
            setImagePreview(couponData.imageUrl);
          }
          
          form.reset({
            code: couponData.code || "",
            name: couponData.name || "",
            discount: couponData.discount || 0,
            usageLimit: couponData.usageLimit || 100,
            expiryDate: couponData.expiryDate 
              ? new Date(couponData.expiryDate)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isActive: couponData.isActive !== undefined ? couponData.isActive : true,
            offerType: couponData.offerType || "discount",
            buyProduct: couponData.buyProduct || "",
            buyProductQuantity: couponData.buyProductQuantity || 0,
            getProduct: couponData.getProduct || "",
            getProductQuantity: couponData.getProductQuantity || 0,
          });
        } else {
          toast({
            title: "Error",
            description:
              "Failed to load offer details. Please try again later.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description:
            error.response?.data?.message ||
            error.message ||
            "Failed to fetch offer details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (couponDataID) fetchCouponDetails();
  }, [couponDataID, toast, form]);

  const updateCouponMutation = useMutation({
    mutationFn: async (data) => {
      // Build FormData for multipart update; include image only if provided
      const formData = new FormData();
      formData.append("code", String(data.code || ""));
      formData.append("name", String(data.name || ""));
      formData.append("offerType", String(data.offerType || offerType));
      formData.append("isActive", String(Boolean(data.isActive)));
      if (data.offerType === "discount") {
        if (data.discount !== undefined && data.discount !== null) {
          formData.append("discount", String(Number(data.discount)));
        }
        if (data.usageLimit !== undefined && data.usageLimit !== null) {
          formData.append("usageLimit", String(Number(data.usageLimit)));
        }
      }
      if (data.offerType === "product") {
        if (data.buyProduct) formData.append("buyProduct", String(data.buyProduct));
        if (data.buyProductQuantity !== undefined && data.buyProductQuantity !== null) {
          formData.append("buyProductQuantity", String(Number(data.buyProductQuantity)));
        }
        if (data.getProduct) formData.append("getProduct", String(data.getProduct));
        if (data.getProductQuantity !== undefined && data.getProductQuantity !== null) {
          formData.append("getProductQuantity", String(Number(data.getProductQuantity)));
        }
      }
      if (data.expiryDate) {
        const iso = new Date(data.expiryDate).toISOString();
        formData.append("expiryDate", iso);
      }
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const response = await apiRequest(
        "PUT",
        `/api/coupons/put/${data.id}`,
        formData
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons/getall"] });
      toast({
        title: "Offer updated",
        description: "Offer has been successfully updated.",
      });
      form.reset();
      onOpenChange(false);
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

  const onSubmit = (data) => {
    updateCouponMutation.mutate({ ...data, id: couponDataID });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
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
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 sm:p-8">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <span className="material-icons text-white text-3xl">edit</span>
              </div>
              <div>
                <DialogTitle className="text-2xl sm:text-3xl font-bold text-white">
                  Edit Offer
                </DialogTitle>
                <p className="text-orange-100 text-sm sm:text-base mt-1">
                  Update your offer details
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-icons text-6xl text-gray-400 animate-spin mb-4">
                refresh
              </span>
              <p className="text-gray-600">Loading offer details...</p>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Offer Type Selection */}
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
                      htmlFor="discount-edit"
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        offerType === "discount"
                          ? "border-orange-500 bg-orange-50 shadow-md"
                          : "border-gray-200 hover:border-orange-300 hover:shadow-sm"
                      }`}
                    >
                      <RadioGroupItem
                        value="discount"
                        id="discount-edit"
                        className="mt-0"
                      />
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-orange-600">
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
                      htmlFor="product-edit"
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        offerType === "product"
                          ? "border-red-500 bg-red-50 shadow-md"
                          : "border-gray-200 hover:border-red-300 hover:shadow-sm"
                      }`}
                    >
                      <RadioGroupItem
                        value="product"
                        id="product-edit"
                        className="mt-0"
                      />
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-red-600">
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

                {/* Basic Information */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 font-semibold">
                          <span className="material-icons text-sm">tag</span>
                          Coupon Code
                        </FormLabel>
                        <FormControl>
                          <Input
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
                          <Input className="h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Discount Offer Fields */}
                {offerType === "discount" && (
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-5 rounded-xl border border-orange-200">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 font-semibold">
                              <span className="material-icons text-sm text-orange-600">
                                percent
                              </span>
                              Discount Percentage
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                className="h-12 text-lg"
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
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
                              <span className="material-icons text-sm text-orange-600">
                                groups
                              </span>
                              Usage Limit
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                className="h-12 text-lg"
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Product Offer Fields */}
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
                                    field.onChange(
                                      parseInt(e.target.value) || 0
                                    )
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
                                    field.onChange(
                                      parseInt(e.target.value) || 0
                                    )
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

                {/* Image Upload */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-semibold text-gray-700">
                    <span className="material-icons text-sm">image</span>
                    Offer Banner (Optional)
                  </Label>
                  <div className="relative">
                    <Input
                      id="offer-image-edit"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <Label
                      htmlFor="offer-image-edit"
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

                {/* Expiry Date */}
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
                          {...field}
                          type="date"
                          className="h-12"
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .split("T")[0]
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

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 sm:flex-none h-12 text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={updateCouponMutation.isLoading}
                    type="submit"
                    className="flex-1 sm:flex-none h-12 text-base bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    {updateCouponMutation.isLoading ? (
                      <>
                        <span className="material-icons mr-2 animate-spin">
                          refresh
                        </span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <span className="material-icons mr-2">
                          check_circle
                        </span>
                        Update Offer
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
