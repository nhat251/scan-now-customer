[FE] Manager / Staff / Kitchen My Branch Info

Description

Allow users with the following roles:

BRANCH_MANAGER

STAFF

KITCHEN

to view the branch/restaurant information assigned to them after login.

FE Routes

Branch List

/me/branches


Branch Detail

/me/branches/{branchId}


APIs

Get My Branches

GET /api/me/branches


Get Branch Detail

GET /api/me/branches/{id}


Flow

After Login

If user role is:

BRANCH_MANAGER

STAFF

KITCHEN

Redirect to:

/me/branches


Load Branches

Call API:

GET /api/me/branches


Single Branch Flow

If user has only 1 assigned branch:

Auto redirect to:

/me/branches/{branchId}


Multiple Branch Flow

If user has multiple assigned branches:

Display branch list

User selects branch to view detail

UI Requirements

Branch List Page

Display simple cards/table containing:

Field

Branch Name

Address

Phone

Status

Action:

View Detail

Branch Detail Page

Display information:

Field

Branch Name

Restaurant ID

Manager Name

Address

Phone

Email

Open Time

Close Time

VAT Percent

Service Charge Percent

Service Charge Fixed

Status

Permission

Permissions

Read Only

Users can:

View branch information only

Users cannot:

Create branch

Edit branch

Delete branch

Authorization Rules

User cannot access branches not assigned to them

Unauthorized branch access should return:

403 Forbidden

or redirect to access denied page

Refresh Token Flow

When API returns 401

Frontend should:

Trigger refresh token flow

Retry failed request

Refresh Token Failed

If refresh token also fails:

Clear authentication data

Redirect to login page

Example:

/login


Loading & Empty States

Loading State

Show loading spinner/skeleton while fetching branches

Show loading state during refresh token flow

Empty State

If user has no assigned branch:

No assigned branch found.


Acceptance Criteria

Branch Manager / Staff / Kitchen can view assigned branches

Redirects correctly after login

Auto redirects to detail page if only one branch exists

Displays branch selection list if multiple branches exist

Refreshing page still reloads branch information correctly

No edit permissions available

401 triggers refresh token flow

Refresh token failure redirects user to login page

