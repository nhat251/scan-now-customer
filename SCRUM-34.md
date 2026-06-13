Story: [FE] Branch Manager Table & QR Management

Description

Build table and QR management screens for Branch Manager.

Branch Manager can:

View tables in their managed branch

Create new table

View table detail

Edit table

Update table status

Activate / Deactivate table

Download QR

Regenerate QR

Notes:

Branch Manager uses the same APIs as Owner

Only manages tables inside their assigned branch

No open table / close session

No order / payment

Business flow is based on the provided backend flow.

Roles

BRANCH_MANAGER

FE Routes

/manager/branches/{branchId}/tables
/manager/branches/{branchId}/tables/create
/manager/branches/{branchId}/tables/{tableId}

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

Screen 1: Branch Manager Table List

Route

/manager/branches/{branchId}/tables

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

GET /api/owner/branches/{branchId}/tables
GET /api/owner/branches/{branchId}/tables?status=AVAILABLE
GET /api/owner/branches/{branchId}/tables?status=OCCUPIED
GET /api/owner/branches/{branchId}/tables?capacity=4
GET /api/owner/branches/{branchId}/tables?search=a7
GET /api/owner/branches/{branchId}/tables?isActive=true

UI Requirements

Header

Branch: Bia 3
Tables | QR Management

Controls

Search table
Filter status
Filter active/inactive
Button: + Create Table

Table/Grid Columns

Table Number
Capacity
Status
Active
Current Session
Actions

Example UI

Table Capacity Status Active Session
A7 2 AVAILABLE true -
A8 4 OCCUPIED true A7X9K2
A9 4 DISABLED true -

Actions

View Detail
Edit
Download QR
Regenerate QR
Deactivate / Activate

Screen 2: Create Table

Route

/manager/branches/{branchId}/tables/create

API

POST /api/owner/branches/{branchId}/tables

Request Body

{
"tableNumber": "A10",
"capacity": 4
}

UI Form

Table Number
Capacity

After Success

Display:

Create table successfully
QR URL
Download QR button

Can optionally call:

GET /api/owner/tables/{tableId}/qr-image

Screen 3: Table Detail

Route

/manager/branches/{branchId}/tables/{tableId}

API

GET /api/owner/branches/{branchId}/tables/{tableId}

UI Requirements

Display:

Table Number
Capacity
Status
Active
QR URL
Created At
Updated At

Current Session

If no session:

No current session

If session exists:

Session Code
Created At
Expires At
Is Active

Actions

Edit Table
Update Status
Download QR
Regenerate QR
Activate / Deactivate

Not Available

Open Table
Close Session
Payment
Order

Screen 4: Edit Table

API

PUT /api/owner/tables/{tableId}

Request Body

{
"tableNumber": "A7",
"capacity": 6
}

Rules

Do not allow editing:

status
qrCodeToken
qrCodeUrl

After Success

Redirect back to detail page or table list

Screen 5: Update Table Status

API

PATCH /api/owner/tables/{tableId}/status

Request Body Examples

{
"status": "RESERVED"
}

Or:

{
"status": "DISABLED"
}

Or:

{
"status": "AVAILABLE"
}

UI Rules

Status dropdown only shows:

AVAILABLE
RESERVED
DISABLED

Do not allow:

OCCUPIED

If table is currently OCCUPIED:

Disable status dropdown

Or show message:

Table is currently serving customers. Status is controlled by active session.

Screen 6: Activate / Deactivate Table

Deactivate

PATCH /api/owner/tables/{tableId}/deactivate

Activate

PATCH /api/owner/tables/{tableId}/activate

UI Labels

Hide table from operation
Enable table again

Screen 7: QR Management

Can be displayed inside table detail page or separate tab.

UI

QR URL
QR Preview
Download QR
Regenerate QR

Download QR

GET /api/owner/tables/{tableId}/qr-image

Regenerate QR

POST /api/owner/tables/{tableId}/regenerate-qr

Confirm Message

Regenerating QR will invalidate the old QR code.

After Regenerate

GET /api/owner/branches/{branchId}/tables/{tableId}

Full Flow

Branch Manager login
→ Open managed branch
→ GET /api/owner/branches/{branchId}/tables

Create table
→ POST /api/owner/branches/{branchId}/tables
→ GET /api/owner/tables/{tableId}/qr-image

View/Edit table
→ GET /api/owner/branches/{branchId}/tables/{tableId}
→ PUT /api/owner/tables/{tableId}

Manage status
→ PATCH /api/owner/tables/{tableId}/status
→ PATCH /activate or /deactivate

Manage QR
→ GET /qr-image
→ POST /regenerate-qr

Business Rules

Branch Manager only sees their managed branch
Branch Manager only manages tables in their own branch
Do not display other branches
No open table operation
No close session operation
No order/payment
OCCUPIED can only be created when Staff opens table
Regenerate QR invalidates old QR

Error Handling

401 Unauthorized

Redirect login or run refresh token flow

403 Forbidden

You do not have permission to access this branch/table

404 Not Found

Table not found

Create Table Failed

Cannot create table

Update Table Failed

Cannot update table

Download QR Failed

Cannot download QR image

Regenerate QR Failed

Cannot regenerate QR

Acceptance Criteria

Branch Manager can view tables in their managed branch

Search/filter tables works correctly

Create table works successfully

View table detail works successfully

Edit table works successfully

Update AVAILABLE / RESERVED / DISABLED status works

OCCUPIED status is not selectable

Activate / Deactivate works

Download QR works

Regenerate QR works

Current session displays correctly if available

No Open Table / Close Session actions

Has loading state

Has empty state

Has error state
