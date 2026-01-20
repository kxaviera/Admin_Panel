"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { UserCog, Plus, Search, Loader2, Trash2 } from "lucide-react";

export default function DispatchersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dispatchers", search],
    queryFn: async () => {
      const res = await apiClient.dispatchers.getAll({ page: 1, limit: 50, q: search.trim() || undefined });
      return res.data.data;
    },
  });

  const dispatchers = useMemo(() => data?.dispatchers ?? [], [data]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiClient.dispatchers.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatchers"] });
      toast.success("Dispatcher created");
      setIsCreateOpen(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to create dispatcher"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.dispatchers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatchers"] });
      toast.success("Dispatcher deleted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete"),
  });

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dispatchers</h1>
          <p className="text-muted-foreground">Manage dispatcher team</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Dispatcher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Dispatcher</DialogTitle>
              <DialogDescription>Creates a dispatcher account (default password will be set if not provided).</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)} disabled={createMutation.isPending}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <UserCog className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{dispatchers.length}</p>
            <p className="text-sm text-muted-foreground">Total Dispatchers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <UserCog className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{dispatchers.filter((d: any) => d.status === "active").length}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <UserCog className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{dispatchers.reduce((sum: number, d: any) => sum + (d.assignedRides || 0), 0)}</p>
            <p className="text-sm text-muted-foreground">Total Assignments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Dispatchers</CardTitle>
          <CardDescription>Manage dispatcher team and assignments</CardDescription>
          <div className="relative mt-4 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="text-red-600 text-sm">{(error as any)?.message || "Failed to load dispatchers"}</div>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Assigned Rides</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatchers.map((dispatcher: any) => (
                <TableRow key={dispatcher._id || dispatcher.id}>
                  <TableCell className="font-medium">{dispatcher.firstName} {dispatcher.lastName}</TableCell>
                  <TableCell>{dispatcher.email}</TableCell>
                  <TableCell>{dispatcher.zone?.name || dispatcher.zone?.code || "-"}</TableCell>
                  <TableCell>{dispatcher.assignedRides || 0}</TableCell>
                  <TableCell>
                    <Badge variant={dispatcher.status === "active" ? "default" : "secondary"}>
                      {dispatcher.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        const id = dispatcher._id || dispatcher.id;
                        if (window.confirm("Delete this dispatcher?")) deleteMutation.mutate(id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

