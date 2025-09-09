import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

export default function GroupedProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("http://localhost:3000/api/batch/get");
        const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products", error);
        toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [toast]);

  const categories = useMemo(() => Array.from(new Set((products || []).map(p => p.category).filter(Boolean))), [products]);
  const types = useMemo(() => Array.from(new Set((products || []).map(p => p.type || p.productType || p?.typeName).filter(Boolean))), [products]);

  const filtered = useMemo(() => {
    return (products || []).filter((p) => {
      const matchesSearch = (p.name || "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      const candidateType = p.type || p.productType || p?.typeName;
      const matchesType = typeFilter === "all" || candidateType === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [products, search, categoryFilter, typeFilter]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of filtered) {
      const rawName = p.name || "";
      const rawCategory = p.category || "";
      const rawType = p.type || p.productType || p?.typeName || "";
      // Normalize grouping key to avoid duplicates from case/spacing differences
      const norm = (v) => String(v).trim().toLowerCase();
      const key = `${norm(rawName)}|${norm(rawCategory)}|${norm(rawType)}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: rawName,
          category: rawCategory,
          type: rawType,
          items: [],
          totalStock: 0,
        });
      }
      const entry = map.get(key);
      entry.items.push(p);
      const qty = (p.quantity ?? p.stock ?? 0) || 0;
      entry.totalStock += Number(qty);
    }
    return Array.from(map.values());
  }, [filtered]);

  return (
    <div className="flex min-h-screen bg-grey-50">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header title="Grouped Products" subtitle="Grouped by name, category, and type" />
        <main className="p-6">
          <Card className="material-elevation-2">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <div className="mt-4 w-full flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative w-full sm:w-72">
                    <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-400">search</span>
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product name..." className="pl-10 pr-4" />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {types.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped.map((g) => (
                      <TableRow key={g.key}>
                        <TableCell>
                          <div className="font-medium text-grey-900">{g.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{g.category || "-"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>{g.type || "-"}</Badge>
                        </TableCell>
                        <TableCell>{g.items.length}</TableCell>
                        <TableCell>{g.totalStock}</TableCell>
                      </TableRow>
                    ))}
                    {grouped.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-grey-500 py-8">No results</TableCell>
                      </TableRow>
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


