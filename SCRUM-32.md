Story: [FE] Staff Table Session Operation

Description

Build table operation screens for Staff.

Staff can:

View table list of their branch

View table detail

Open table session

View session code to give customers

Close session manually if needed

Notes:

Customer scanning QR does NOT automatically make table OCCUPIED

Table only changes to OCCUPIED when Staff clicks Open Table

Currently there is no Order API, so this screen only handles Table + Session

Roles

STAFF


Kitchen is currently not part of the table operation flow.

Kitchen features will be implemented later when these modules exist:

Order
Kitchen Queue
Kitchen Ticket
Order Status


FE Routes

/me/branches/{branchId}/tables
/me/tables/{tableId}


APIs

Get Tables By Branch

GET /api/me/branches/{branchId}/tables


Get Table Detail

GET /api/me/tables/{tableId}


Open Table Session

POST /api/me/branches/{branchId}/tables/{tableId}/open


Close Session

PATCH /api/me/sessions/{sessionId}/close


Screen 1: Staff Tables

Route

/me/branches/{branchId}/tables


Query Params

pageNumber
pageSize
search
status
isActive
sortBy
sortDirection


Example Requests

GET /api/me/branches/{branchId}/tables
GET /api/me/branches/{branchId}/tables?status=AVAILABLE
GET /api/me/branches/{branchId}/tables?status=OCCUPIED
GET /api/me/branches/{branchId}/tables?search=a7


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

Display tables in grid/list format:

Table A7
2 seats
AVAILABLE


Table A8
4 seats
OCCUPIED
Session: A7X9K2


Table A9
DISABLED


Filters

All
Available
Occupied
Reserved
Disabled


Table Card Fields

Table Number
Capacity
Status
Is Active
Current Session Code if available
Expires At if available


Actions

Each table has:

View Detail


If table is AVAILABLE:

Open Table


If table is OCCUPIED and has currentSession:

Close Session


Screen 2: Table Detail

Route

/me/tables/{tableId}


API

GET /api/me/tables/{tableId}


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
    "createdAt": "2026-05-22T09:00:00Z",
    "updatedAt": "2026-05-22T10:00:00Z",
    "currentSession": null
  }
}


UI Requirements

Display:

Table Number
Capacity
Status
Is Active
Branch Name
Created At
Updated At


If no session exists:

Current session: None


If session exists:

Session ID
Session Code
Opened At
Expires At
Is Active


Open Table Flow

Condition

Only show open button when:

status = AVAILABLE
currentSession = null
isActive = true


Button

Open Table


Loading:

Opening table...


API

POST /api/me/branches/{branchId}/tables/{tableId}/open


No request body required.

Success Response Example

{
  "code": 200,
  "message": "Open table successfully",
  "result": {
    "sessionId": "7fa85f64-5717-4562-b3fc-2c963f66afa9",
    "tableId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "branchId": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
    "sessionCode": "A7X9K2",
    "isActive": true,
    "expiresAt": "2026-05-22T13:05:00Z",
    "createdAt": "2026-05-22T10:05:00Z"
  }
}


After Open Success UI

Show modal or success panel:

Table A7 opened successfully

Session Code: A7X9K2

Give this code to the customer


Buttons:

Copy Code
Close


Close Session Flow

Condition

Only show close button when:

status = OCCUPIED
currentSession != null
currentSession.isActive = true


API

PATCH /api/me/sessions/{sessionId}/close


No request body required.

Button

Close Session Manually


Loading:

Closing session...


Use Cases

Customer changes table
Customer does not order
Wrong table opened
Customer leaves before payment flow exists


Success Response Example

{
  "code": 200,
  "message": "Close session successfully"
}


After Close Success UI

Refresh table detail:

GET /api/me/tables/{tableId}


Expected result:

Table A7
AVAILABLE
No current session


Full Staff Flow

Staff opens Tables screen
→ GET /api/me/branches/{branchId}/tables

Customer scans QR
→ Staff does nothing if table not opened yet

Customer calls staff
→ Staff clicks table
→ GET /api/me/tables/{tableId}

Staff clicks Open Table
→ POST /api/me/branches/{branchId}/tables/{tableId}/open

Staff gives sessionCode to customer
→ Customer enters session code

Staff refreshes table list
→ GET /api/me/branches/{branchId}/tables

If session needs to be closed
→ PATCH /api/me/sessions/{sessionId}/close


Important Business Rules

Customer Scan QR

Customer scanning QR only opens customer UI.

Does not change:

Table.Status
QrSession
Staff dashboard


Open Table

When Staff opens table successfully:

Table.Status = OCCUPIED
QrSession.IsActive = true
sessionCode is generated


Customer Join Session

Currently Staff cannot see joined customer count because there is no:

SessionParticipant
Order


Staff only sees:

Table is OCCUPIED
Session code is active


Close Session

When closing session:

QrSession.IsActive = false
Table.Status = AVAILABLE
currentSession = null


Error Handling

401 Unauthorized

Redirect to login or run refresh token flow.

403 Forbidden

Display:

You do not have permission to access this branch/table


404 Not Found

Display:

Table or session not found


Open Table Failed

Display:

Cannot open table session


Close Session Failed

Display:

Cannot close session


Acceptance Criteria

Staff can view branch tables

Search/filter tables works correctly

Clicking table opens detail screen

AVAILABLE tables show Open Table button

Open table works and displays sessionCode

Copy sessionCode works

OCCUPIED tables show current session

Manual close session works

After closing session, table returns to AVAILABLE

Customer scanning QR does not change table status

Has loading state

Has empty state

Has error state

Does not display order/payment because APIs do not exist yet

