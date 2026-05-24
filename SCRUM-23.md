[FE] Staff / Kitchen Menu Availability
Description

Build a screen for Staff/Kitchen to view the menu of their assigned branch and manage item availability.

Staff/Kitchen can:

View the menu of their branch

View menu item details

Toggle item availability (Available / Out of Stock)

Select multiple items and update availability in bulk

Staff/Kitchen cannot:

Create menu items

Edit menu items

Edit prices

Manage categories

FE Routes

/me/branches/{branchId}/menu

/me/menu-items/{menuItemId}

APIs

GET /api/me/branches/{branchId}/menu

GET /api/me/menu-items/{menuItemId}

PATCH /api/me/menu-items/{menuItemId}/toggle-available

PATCH /api/me/branches/{branchId}/menu-items/bulk-availability

Menu List Query Params

pageNumber

pageSize

search

isActive

isAvailable

isFeatured

categoryId

sortBy

sortDirection

Bulk Availability Request Body

{
  "isAvailable": false,
  "menuItemIds": [
    "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "5fa85f64-5717-4562-b3fc-2c963f66afa8"
  ]
}


UI Requirements

Menu Availability List

Display menu grouped by category:

Category name

Menu item image

Menu item name

Price

Available status

Active status

Checkbox selection

Toggle availability button

Filters

Search

Available / Out of Stock

Category

Bulk Actions

Set as Available

Set as Unavailable

Menu Item Detail

Display:

Image

Name

Description

Category

Price

Preparation Time

Available Status

Active Status

Frontend Rules

Only show actions related to availability management

Do not show create/edit/update price buttons

After successful toggle, update the item in the list immediately

After successful bulk update, clear selected items

Acceptance Criteria

Staff/Kitchen can view the menu of their assigned branch

Menu item details are displayed correctly

Toggle availability works properly

Bulk availability update works properly

No create/edit/price management buttons are shown

Has loading state, empty state, and error state

If API returns 403, display:

You do not have permission to access this branch


