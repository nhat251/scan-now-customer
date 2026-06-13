import { TableQrTokenPageClient } from "@/components/customer/table-qr-token-page-client";

type TableQrRouteProps = {
  params: Promise<{
    qrCodeToken: string;
  }>;
};

const TableQrRoute = async ({ params }: TableQrRouteProps) => {
  const { qrCodeToken } = await params;

  return <TableQrTokenPageClient qrCodeToken={qrCodeToken} />;
};

export default TableQrRoute;
