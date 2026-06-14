"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Eye, QrCode } from "lucide-react";
import { type FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import {
  useCreateOwnerTableMutation,
  useDownloadOwnerTableQrMutation,
} from "@/hooks/mutations/useOwnerTableMutations";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type { OwnerTableFormValues, OwnerTableResponse } from "@/types/owner-table";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  downloadQrBlob,
  emptyOwnerTableForm,
  getOwnerTableDetailPath,
  getOwnerTableListPath,
  getOwnerTablePayload,
  getQrFileName,
  getTablePortalCopy,
  getTablePortalNavItems,
  type TableManagementPortal,
} from "./helpers";
import { OwnerTableForm } from "./owner-table-form";

type OwnerTableCreatePageProps = {
  branchId: string;
  portal?: TableManagementPortal;
};

const ownerTableSchema = z.object({
  tableNumber: z.string().trim().min(1, "Số bàn là bắt buộc."),
  capacity: z.string().refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 1;
    },
    { message: "Sức chứa phải lớn hơn hoặc bằng 1." }
  ),
});

export const OwnerTableCreatePage = ({ branchId, portal = "owner" }: OwnerTableCreatePageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const copy = getTablePortalCopy(portal);
  const [createdTable, setCreatedTable] = useState<OwnerTableResponse | null>(null);
  const createMutation = useCreateOwnerTableMutation();
  const downloadMutation = useDownloadOwnerTableQrMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OwnerTableFormValues>({
    resolver: zodResolver(ownerTableSchema),
    defaultValues: emptyOwnerTableForm,
  });

  const submit = async (values: OwnerTableFormValues) => {
    const response = await createMutation.mutateAsync({
      branchId,
      data: getOwnerTablePayload(values),
    });

    setCreatedTable(response.result);
  };

  const onValidationError = (errors: FieldErrors<OwnerTableFormValues>) => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      showNotify({ type: "warning", message: firstError.message });
    }
  };

  const downloadQr = async () => {
    if (!createdTable) {
      return;
    }

    const blob = await downloadMutation.mutateAsync(createdTable.tableId);
    downloadQrBlob(blob, getQrFileName(createdTable));
  };

  return (
    <PortalShell
      title="Tạo bàn"
      description="Tạo bàn cho chi nhánh. Mã và URL QR được hệ thống tự động tạo."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getTablePortalNavItems(portal, branchId)}
      topbarTitle={currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      headerAction={
        <Button asChild variant="outline">
          <Link href={getOwnerTableListPath(branchId, portal)}>
            <ArrowLeft className="size-4" />
            Danh sách bàn
          </Link>
        </Button>
      }
      stats={
        <>
          <PortalStatCard
            label="Trạng thái mặc định"
            value="Đang phục vụ"
            helper="Bàn mới sẵn sàng để sử dụng"
          />
          <PortalStatCard
            label="Đang hoạt động"
            value="Đã bật"
            helper="Bàn mới được bật mặc định"
          />
          <PortalStatCard label="QR" value="Tự động" helper="Hệ thống tự tạo mã và URL QR" />
          <PortalStatCard
            label="Phạm vi"
            value="Chi nhánh"
            helper="Hệ thống kiểm tra quyền sở hữu chi nhánh"
          />
        </>
      }
    >
      {createdTable ? (
        <section className="border-success/50 bg-success text-success-foreground rounded-xl border p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <QrCode className="size-5" />
                <h2 className="text-lg font-bold">Đã tạo bàn thành công</h2>
              </div>
              <p className="mt-2 text-sm">
                Bàn {createdTable.tableNumber} đã sẵn sàng. Hãy tải mã QR hoặc mở trang chi tiết.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={downloadQr} disabled={downloadMutation.isPending}>
                <Download className="size-4" />
                Tải mã QR
              </Button>
              <Button asChild variant="success">
                <Link href={getOwnerTableDetailPath(branchId, createdTable.tableId, portal)}>
                  <Eye className="size-4" />
                  Xem chi tiết
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <OwnerTableForm
        register={register}
        errors={errors}
        submitting={createMutation.isPending}
        submitLabel="Tạo bàn"
        onSubmit={handleSubmit(submit, onValidationError)}
      />
    </PortalShell>
  );
};
