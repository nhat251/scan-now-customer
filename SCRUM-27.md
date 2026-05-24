[FE] Branch Manager Category / Menu / Price Management
Description

Build screens for Branch Managers to manage categories, menu items, and pricing within their assigned branch.

Notes:

Frontend uses /manager/... routes

Backend APIs reuse /api/owner/...

Backend validates permissions based on BRANCH_MANAGER role from access token

Manager can only manage resources within their assigned branch

FE Routes

Category Management

/manager/branches/{branchId}/categories

/manager/branches/{branchId}/categories/create

/manager/branches/{branchId}/categories/{categoryId}

Menu Item Management

/manager/branches/{branchId}/menu-items

/manager/branches/{branchId}/menu-items/create

/manager/menu-items/{menuItemId}

/manager/menu-items/{menuItemId}/price-history

APIs

Reuse the same APIs as Owner:

Category APIs

GET /api/owner/branches/{branchId}/categories

GET /api/owner/branches/{branchId}/categories/{categoryId}

POST /api/owner/branches/{branchId}/categories

PUT /api/owner/branches/{branchId}/categories/{categoryId}

PATCH /api/owner/branches/{branchId}/categories/reorder

PATCH /api/owner/branches/{branchId}/categories/{categoryId}/active

PATCH /api/owner/branches/{branchId}/categories/{categoryId}/inactive

Menu Item APIs

GET /api/owner/branches/{branchId}/menu-items

GET /api/owner/menu-items/{menuItemId}

POST /api/owner/branches/{branchId}/categories/{categoryId}/menu-items

PUT /api/owner/menu-items/{menuItemId}

PATCH /api/owner/menu-items/{menuItemId}/active

PATCH /api/owner/menu-items/{menuItemId}/inactive

PATCH /api/owner/branches/{branchId}/menu-items/reorder

PATCH /api/owner/menu-items/{menuItemId}/toggle-available

PATCH /api/owner/branches/{branchId}/menu-items/bulk-availability

PATCH /api/owner/menu-items/{menuItemId}/toggle-featured

Price APIs

PATCH /api/owner/menu-items/{menuItemId}/price

GET /api/owner/menu-items/{menuItemId}/price-history

Features

Branch Manager can:

Create, update, and manage categories

Activate/deactivate categories

Reorder categories

Create, update, and manage menu items

Activate/deactivate menu items

Toggle item availability

Toggle featured status

Bulk update availability

Reorder menu items

Update menu item prices

View price history

Branch Manager cannot:

Access or manage other branches

Access menu items outside assigned branch

Access categories outside assigned branch

UI Requirements

Reusable components from Owner module:

CategoryList

CategoryForm

MenuItemList

MenuItemForm

PriceHistoryTab

UpdatePriceModal

Differences from Owner module:

Route prefix changes from /owner to /manager

Permission scope is limited to assigned branch

Error Handling

If backend returns:

403 Forbidden


Display message:

You do not have permission to access this branch


Acceptance Criteria

Manager can manage categories within assigned branch

Manager can manage menu items within assigned branch

Manager can update prices for menu items within assigned branch

Manager can view price history

Manager cannot access or manage other branches

Reuse Owner UI logic/components where possible

Proper permission message is shown for 403 Forbidden

