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
import { useEffect } from "react";
import axios from "axios";

export default function EditCouponDialog({ open, onOpenChange, couponDataID }) {
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
      discount: 0,
      usageLimit: 100,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchCouponDetails = async () => {
      try {
        const response = await axios.get(
          `https://saiapi.skillhiveinnovations.com/api/coupons/get/${couponDataID}`
        );

        if (response.data && response.data.data) {
          const couponData = response.data.data;

          form.reset({
            code: couponData.code || "",
            name: couponData.name || "",
            discount: couponData.discount || 0,
            usageLimit: couponData.usageLimit || 100,
            expiryDate:
              couponData.expiryDate ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isActive: couponData.isActive || true,
          });
        } else {
          toast({
            title: "Error",
            description:
              "Failed to load coupon details. Please try again later.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description:
            error.response?.data?.message ||
            error.message ||
            "Failed to fetch coupon",
          variant: "destructive",
        });
      }
    };

    if (couponDataID) fetchCouponDetails();
  }, [couponDataID, toast, form]);

  const updateCouponMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest(
        "PUT",
        `/api/coupons/put/${data.id}`,
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons/getall"] });
      toast({
        title: "Coupon updated",
        description: "Coupon has been successfully updated.",
      });
      form.reset();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Coupon</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coupon Code</FormLabel>
                  <FormControl>
                    <Input
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
                  <FormLabel>Coupon Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount (%)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
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
                  <FormLabel>Usage Limit</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
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
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={updateCouponMutation.isLoading} type="submit">
                {updateCouponMutation.isLoading
                  ? "Updating..."
                  : "Update Coupon"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
