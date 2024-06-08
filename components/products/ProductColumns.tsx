"use client";

import { ColumnDef } from "@tanstack/react-table";
import Delete from "../custom ui/Delete";
import Link from "next/link";
import { Edit } from "lucide-react";

export const columns: ColumnDef<ProductType>[] = [
  {
    accessorKey: "title",
    header: "Título",
    cell: ({ row }) => <p>{row.original.title}</p>
  },
  {
    accessorKey: "category",
    header: "Categoria",
  },
  {
    accessorKey: "collections",
    header: "Coleções",
    cell: ({ row }) => row.original.collections.map((collection) => collection.title).join(", "),
  },
  {
    accessorKey: "price",
    header: "Preço (€)",
  },
  {
    accessorKey: "expense",
    header: "Custo (€)",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-center itmes-center gap-2">
        <Link
           href={`/products/${row.original._id}`}
          className="cursor-pointer bg-blue-1 h-10 w-12 py-2 rounded-lg flex justify-center items-center"
        >
          <Edit className="text-white h-4 w-4" />
        </Link>
        <Delete item="product" id={row.original._id} />
      </div>
    ),
  },
];
