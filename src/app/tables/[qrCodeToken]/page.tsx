import { TableSessionPage } from "@/components/customer/table-session-page";

type Props = {
  params: Promise<{
    qrCodeToken: string;
  }>;
};

const PublicTableRoute = async ({ params }: Props) => {
  const { qrCodeToken } = await params;

  return <TableSessionPage qrCodeToken={decodeURIComponent(qrCodeToken)} />;
};

export default PublicTableRoute;
