"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

export const columns: ColumnDef<OrderColumnType>[] = [
  {
    accessorKey: "_id",
    header: "Pedido",
    cell: ({ row }) => {
      return (
        <Link
          href={`/orders/${row.original._id}`}
          className="hover:text-blue-1"
        >
          {row.original._id}
        </Link>
      );
    },
  },
  {
    accessorKey: "customer",
    header: "Cliente",
  },
  {
    accessorKey: "products",
    header: "Produtos",
  },
  {
    accessorKey: "totalAmount",
    header: "Total (€)",
  },
  {
    accessorKey: "createdAt",
    header: "Inserido em:",
  },
];
