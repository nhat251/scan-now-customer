import { isAxiosError } from "axios";

const ERROR_CODE_LABELS: Record<string, string> = {
  INVALID_CREDENTIALS: "Tên đăng nhập hoặc mật khẩu không đúng.",
  MANAGER_HAS_NO_BRANCH: "Tài khoản quản lý chưa được gán chi nhánh.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  NOT_FOUND: "Không tìm thấy dữ liệu được yêu cầu.",
  SESSION_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  TABLE_OCCUPIED: "Bàn này đang có khách.",
  VALIDATION_ERROR: "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.",
};

const NORMALIZED_MESSAGE_LABELS: Record<string, string> = {
  "invalid credentials": "Tên đăng nhập hoặc mật khẩu không đúng.",
  "manager has no branch": "Tài khoản quản lý chưa được gán chi nhánh.",
  "branch is outside your managed scope.": "Chi nhánh nằm ngoài phạm vi quản lý của bạn.",
  "network error": "Không thể kết nối máy chủ. Vui lòng thử lại.",
  "request failed with status code 401": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "request failed with status code 403": "Bạn không có quyền thực hiện thao tác này.",
  "request failed with status code 404": "Không tìm thấy dữ liệu được yêu cầu.",
};

type ApiErrorPayload = {
  code?: string;
  detail?: string;
  message?: string;
  title?: string;
};

const getKnownMessage = (payload?: ApiErrorPayload) => {
  const code = payload?.code?.toUpperCase();
  if (code && ERROR_CODE_LABELS[code]) {
    return ERROR_CODE_LABELS[code];
  }

  const rawMessage = payload?.message ?? payload?.detail ?? payload?.title;
  if (!rawMessage) {
    return undefined;
  }

  return NORMALIZED_MESSAGE_LABELS[rawMessage.trim().toLowerCase()];
};

export const getVietnameseApiErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError<ApiErrorPayload>(error)) {
    return fallback;
  }

  const knownMessage = getKnownMessage(error.response?.data);
  if (knownMessage) {
    return knownMessage;
  }

  const status = error.response?.status;
  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }
  if (status === 403) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }
  if (status === 404) {
    return "Không tìm thấy dữ liệu được yêu cầu.";
  }
  if (status !== undefined && status >= 500) {
    return "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
  }

  return fallback;
};
