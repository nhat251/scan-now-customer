Story: [FE] Owner Table & QR Management

Description

Xây dựng màn hình quản lý bàn và QR cho Owner.

Owner có thể:

Xem danh sách bàn của branch

Tạo bàn mới

Xem chi tiết bàn

Sửa thông tin bàn

Đổi trạng thái bàn

Activate / Deactivate bàn

Download QR

Regenerate QR

Lưu ý:

Đây là màn cấu hình bàn

Không phải màn vận hành session

Không có open/close session

Không có order/payment

Chi tiết flow và nghiệp vụ dựa trên tài liệu backend hiện tại.

Roles

OWNER


FE Routes

/owner/branches/{branchId}/tables
/owner/branches/{branchId}/tables/create
/owner/branches/{branchId}/tables/{tableId}


APIs

Get Tables By Branch

GET /api/owner/branches/{branchId}/tables


Get Table Detail

GET /api/owner/branches/{branchId}/tables/{tableId}


Create Table

POST /api/owner/branches/{branchId}/tables


Update Table

PUT /api/owner/tables/{tableId}


Update Table Status

PATCH /api/owner/tables/{tableId}/status


Activate Table

PATCH /api/owner/tables/{tableId}/activate


Deactivate Table

PATCH /api/owner/tables/{tableId}/deactivate


Download QR Image

GET /api/owner/tables/{tableId}/qr-image


Regenerate QR

POST /api/owner/tables/{tableId}/regenerate-qr


Screen 1: Table List

Route

/owner/branches/{branchId}/tables


Query Params

pageNumber
pageSize
search
status
capacity
isActive
sortBy
sortDirection


Example Requests

Filter Available

GET /api/owner/branches/{branchId}/tables?status=AVAILABLE


Filter Capacity

GET /api/owner/branches/{branchId}/tables?capacity=4


Search Table

GET /api/owner/branches/{branchId}/tables?search=a7


Filter Active

GET /api/owner/branches/{branchId}/tables?isActive=true


Success Response Example

{
  "code": 200,
  "message": "Get tables successfully",
  "result": {
    "items": [
      {
        "tableId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "branchId": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
        "branchName": "Bia 3",
        "tableNumber": "A7",
        "capacity": 2,
        "status": "AVAILABLE",
        "isActive": true,
        "qrCodeToken": "qr_token_xyz",
        "qrCodeUrl": "https://scan-now-customer.vercel.app/tables/qr_token_xyz",
        "createdAt": "2026-05-22T09:00:00Z",
        "updatedAt": "2026-05-22T10:00:00Z",
        "currentSession": null
      },
      {
        "tableId": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
        "branchId": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
        "branchName": "Bia 3",
        "tableNumber": "A8",
        "capacity": 4,
        "status": "OCCUPIED",
        "isActive": true,
        "qrCodeToken": "qr_token_abc",
        "qrCodeUrl": "https://scan-now-customer.vercel.app/tables/qr_token_abc",
        "createdAt": "2026-05-22T09:00:00Z",
        "updatedAt": "2026-05-22T10:00:00Z",
        "currentSession": {
          "sessionId": "7fa85f64-5717-4562-b3fc-2c963f66afa9",
          "sessionCode": "A7X9K2",
          "openedAt": "2026-05-22T10:05:00Z",
          "expiresAt": "2026-05-22T13:05:00Z",
          "isActive": true
        }
      }
    ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalItems": 2,
    "totalPages": 1
  }
}


UI Requirements

Table/Grid Columns

Table Number
Capacity
Status
Is Active
Current Session
Created At
Actions


Example UI

Bàn      Sức chứa     Status       Active      Session
A7       2            AVAILABLE    true        -
A8       4            OCCUPIED     true        A7X9K2
A9       4            DISABLED     true        -


Actions

View
Edit
Download QR
Regenerate QR
Activate
Deactivate


Screen 2: Table Detail

Route

/owner/branches/{branchId}/tables/{tableId}


API

GET /api/owner/branches/{branchId}/tables/{tableId}


Success Response Example

{
  "code": 200,
  "message": "Get table successfully",
  "result": {
    "tableId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "branchId": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
    "branchName": "Bia 3",
    "tableNumber": "A7",
    "capacity": 2,
    "status": "AVAILABLE",
    "isActive": true,
    "qrCodeToken": "qr_token_xyz",
    "qrCodeUrl": "https://scan-now-customer.vercel.app/tables/qr_token_xyz",
    "createdAt": "2026-05-22T09:00:00Z",
    "updatedAt": "2026-05-22T10:00:00Z",
    "currentSession": null
  }
}


UI Requirements

Hiển thị:

Table Number
Capacity
Status
Is Active
QR URL
Created At
Updated At


Current Session Section

Nếu:

currentSession != null


Hiển thị:

Session Code
Opened At
Expires At


Nếu không có session:

Không có phiên hiện tại


Screen 3: Create Table

Route

/owner/branches/{branchId}/tables/create


API

POST /api/owner/branches/{branchId}/tables


Request Body

{
  "tableNumber": "A7",
  "capacity": 2
}


Backend Auto Generate

Backend tự sinh:

qrCodeToken
qrCodeUrl
status = AVAILABLE
isActive = true


Success Response Example

{
  "code": 201,
  "message": "Create table successfully",
  "result": {
    "tableId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tableNumber": "A7",
    "capacity": 2,
    "status": "AVAILABLE",
    "isActive": true,
    "qrCodeToken": "qr_token_xyz",
    "qrCodeUrl": "https://scan-now-customer.vercel.app/tables/qr_token_xyz"
  }
}


After Create Success

Hiển thị:

Tạo bàn thành công


Buttons:

Download QR
View Detail


Screen 4: Edit Table

API

PUT /api/owner/tables/{tableId}


Request Body

{
  "tableNumber": "A7",
  "capacity": 4
}


Important Rules

Không cho sửa:

status
qrCodeToken
qrCodeUrl


Screen 5: Update Table Status

API

PATCH /api/owner/tables/{tableId}/status


Request Body Examples

RESERVED

{
  "status": "RESERVED"
}


DISABLED

{
  "status": "DISABLED"
}


AVAILABLE

{
  "status": "AVAILABLE"
}


Important Business Rule

Không cho Owner set:

{
  "status": "OCCUPIED"
}


Vì:

OCCUPIED chỉ được tạo khi Staff mở bàn


UI Rules

Dropdown status chỉ hiển thị:

AVAILABLE
RESERVED
DISABLED


Screen 6: Activate / Deactivate Table

Activate

PATCH /api/owner/tables/{tableId}/activate


Deactivate

PATCH /api/owner/tables/{tableId}/deactivate


Business Meaning

Status = DISABLED
→ Bàn bảo trì / hỏng nhưng vẫn tồn tại

isActive = false
→ Ẩn bàn khỏi vận hành


Screen 7: Download QR

API

GET /api/owner/tables/{tableId}/qr-image


Expected Result

Download file PNG.

QR chứa URL:

https://scan-now-customer.vercel.app/tables/{qrCodeToken}


Screen 8: Regenerate QR

API

POST /api/owner/tables/{tableId}/regenerate-qr


Warning Modal

Regenerate QR sẽ làm QR cũ không còn hợp lệ.


Success Response Example

{
  "code": 200,
  "message": "Regenerate QR successfully",
  "result": {
    "qrCodeToken": "new_qr_token_xyz",
    "qrCodeUrl": "https://scan-now-customer.vercel.app/tables/new_qr_token_xyz"
  }
}


After Regenerate Success

Actions:

Download QR mới
Copy QR URL


Full Owner Flow

Owner vào Table Management
→ Chọn branch
→ GET /api/owner/branches/{branchId}/tables

Tạo bàn
→ POST /api/owner/branches/{branchId}/tables
→ Download QR

Sửa bàn
→ GET detail
→ PUT /api/owner/tables/{tableId}

Đổi trạng thái
→ PATCH /api/owner/tables/{tableId}/status

Ẩn/mở bàn
→ PATCH activate/deactivate

QR lỗi/mất/lộ
→ POST regenerate-qr
→ Download QR mới


Important Restrictions

Owner không có:

Mở bàn
Đóng phiên
Nhập mã phiên
Order
Payment


Những phần đó thuộc:

Staff flow
Customer flow
Payment flow


Error Handling

401 Unauthorized

Redirect login hoặc chạy refresh token flow.

403 Forbidden

You do not have permission to access this branch/table


404 Not Found

Table not found


Regenerate QR Failed

Cannot regenerate QR


Download QR Failed

Cannot download QR image


Acceptance Criteria

Owner xem được danh sách bàn theo branch

Search/filter/sort hoạt động

Create table hoạt động

Edit table hoạt động

Update status hoạt động

Activate/deactivate hoạt động

Download QR hoạt động

Regenerate QR hoạt động

QR cũ invalid sau regenerate

currentSession hiển thị đúng nếu có

Không có open/close session

Có loading state

Có empty state

Có error state

