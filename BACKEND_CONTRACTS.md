# BACKEND_CONTRACTS

## Source of truth

- Scalar UI: `https://scannow.onrender.com/scalar/v1`
- OpenAPI JSON: `https://scannow.onrender.com/openapi/v1.json`
- Server listed in spec: `http://scannow.onrender.com/`
- If local frontend DTOs differ from this published contract, prefer the published backend contract unless a repo note explicitly says otherwise.

## Global API conventions

- OpenAPI version: `3.1.1`
- API title/version: `ScanNow.Web | v1` / `1.0.0`
- Most endpoints return a JSON envelope shaped like `ApiResponse<T>` with `result`, `code`, and `message`.
- Paginated list endpoints return `PagedResult<T>` inside `result` with `items`, `pageNumber`, `pageSize`, `totalItems`, and `totalPages`.
- The OpenAPI spec does not expose an explicit `securitySchemes` section, but the frontend currently sends bearer access tokens and uses refresh-cookie flows via `src/services/axiosBasic.tsx`.

## Common response envelopes

### `ApiResponse`
- `code?`: `['integer', 'string']`
- `message?`: `string`

### `PagedResultOfBranchResponse`
- `items?`: `BranchResponse[]`
- `pageNumber?`: `['integer', 'string']`
- `pageSize?`: `['integer', 'string']`
- `totalItems?`: `['integer', 'string']`
- `totalPages?`: `['integer', 'string']`

### `PagedResultOfOwnerScopedUserResponse`
- `items?`: `OwnerScopedUserResponse[]`
- `pageNumber?`: `['integer', 'string']`
- `pageSize?`: `['integer', 'string']`
- `totalItems?`: `['integer', 'string']`
- `totalPages?`: `['integer', 'string']`

### `PagedResultOfManagerScopedUserResponse`
- `items?`: `ManagerScopedUserResponse[]`
- `pageNumber?`: `['integer', 'string']`
- `pageSize?`: `['integer', 'string']`
- `totalItems?`: `['integer', 'string']`
- `totalPages?`: `['integer', 'string']`

### `PagedResultOfCategoryResponse`
- `items?`: `CategoryResponse[]`
- `pageNumber?`: `['integer', 'string']`
- `pageSize?`: `['integer', 'string']`
- `totalItems?`: `['integer', 'string']`
- `totalPages?`: `['integer', 'string']`

### `PagedResultOfMenuItemResponse`
- `items?`: `MenuItemResponse[]`
- `pageNumber?`: `['integer', 'string']`
- `pageSize?`: `['integer', 'string']`
- `totalItems?`: `['integer', 'string']`
- `totalPages?`: `['integer', 'string']`

### `PagedResultOfRestaurantResponse`
- `items?`: `RestaurantResponse[]`
- `pageNumber?`: `['integer', 'string']`
- `pageSize?`: `['integer', 'string']`
- `totalItems?`: `['integer', 'string']`
- `totalPages?`: `['integer', 'string']`

### `PagedResultOfMenuCategoryResponse`
- `items?`: `MenuCategoryResponse[]`
- `pageNumber?`: `['integer', 'string']`
- `pageSize?`: `['integer', 'string']`
- `totalItems?`: `['integer', 'string']`
- `totalPages?`: `['integer', 'string']`

## Endpoint catalog

### AdminMenu

#### `GET /api/admin/branches/{branchId}/categories`
- Parameters: `branchId` (path, string (uuid)), `PageNumber` (query, ['integer', 'string']), `PageSize` (query, ['integer', 'string']), `Search` (query, string), `IsActive` (query, boolean), `SortBy` (query, string), `SortDirection` (query, string)
- Request body: `None`
- Responses: `200` → `ApiResponseOfPagedResultOfCategoryResponse`

#### `GET /api/admin/branches/{branchId}/categories/{id}`
- Parameters: `branchId` (path, string (uuid)), `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfCategoryResponse`

#### `GET /api/admin/branches/{branchId}/menu-items`
- Parameters: `branchId` (path, string (uuid)), `PageNumber` (query, ['integer', 'string']), `PageSize` (query, ['integer', 'string']), `Search` (query, string), `IsActive` (query, boolean), `IsAvailable` (query, boolean), `IsFeatured` (query, boolean), `CategoryId` (query, string (uuid)), `SortBy` (query, string), `SortDirection` (query, string)
- Request body: `None`
- Responses: `200` → `ApiResponseOfPagedResultOfMenuItemResponse`

#### `GET /api/admin/menu-items/{id}`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfMenuItemResponse`

#### `GET /api/admin/menu-items/{id}/price-history`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfIReadOnlyListOfPriceHistoryResponse`

### AdminRestaurants

#### `GET /api/admin/restaurants`
- Parameters: `PageNumber` (query, ['integer', 'string']), `PageSize` (query, ['integer', 'string']), `Search` (query, string), `IsActive` (query, boolean), `SortBy` (query, string), `SortDirection` (query, string)
- Request body: `None`
- Responses: `200` → `ApiResponseOfPagedResultOfRestaurantResponse`

#### `POST /api/admin/restaurants`
- Parameters: None documented
- Request body: `CreateRestaurantRequest`
- Responses: `200` → `ApiResponseOfRestaurantResponse`

#### `GET /api/admin/restaurants/{id}`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfRestaurantResponse`

#### `PUT /api/admin/restaurants/{id}`
- Parameters: `id` (path, string (uuid))
- Request body: `UpdateRestaurantRequest`
- Responses: `200` → `ApiResponseOfRestaurantResponse`

#### `PATCH /api/admin/restaurants/{id}/ban`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfRestaurantResponse`

#### `GET /api/admin/restaurants/{id}/branches`
- Parameters: `id` (path, string (uuid)), `PageNumber` (query, ['integer', 'string']), `PageSize` (query, ['integer', 'string']), `Search` (query, string), `IsActive` (query, boolean), `SortBy` (query, string), `SortDirection` (query, string)
- Request body: `None`
- Responses: `200` → `ApiResponseOfPagedResultOfBranchResponse`

#### `GET /api/admin/restaurants/{id}/branches/{branchId}`
- Parameters: `id` (path, string (uuid)), `branchId` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfBranchResponse`

#### `PATCH /api/admin/restaurants/{id}/unban`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfRestaurantResponse`

### AdminUsers

#### `GET /api/admin/users/owners`
- Parameters: `PageNumber` (query, ['integer', 'string']), `PageSize` (query, ['integer', 'string']), `Search` (query, string), `Role` (query, string), `BranchId` (query, string (uuid)), `IsActive` (query, boolean), `IsBanned` (query, boolean), `SortBy` (query, string), `SortDirection` (query, string)
- Request body: `None`
- Responses: `200` → `ApiResponseOfPagedResultOfOwnerUserResponse`

#### `POST /api/admin/users/owners`
- Parameters: None documented
- Request body: `CreateOwnerRequest`
- Responses: `200` → `ApiResponseOfOwnerUserResponse`

#### `GET /api/admin/users/owners/available`
- Parameters: `PageNumber` (query, ['integer', 'string']), `PageSize` (query, ['integer', 'string']), `Search` (query, string), `Role` (query, string), `BranchId` (query, string (uuid)), `IsActive` (query, boolean), `IsBanned` (query, boolean), `SortBy` (query, string), `SortDirection` (query, string)
- Request body: `None`
- Responses: `200` → `ApiResponseOfPagedResultOfOwnerUserResponse`

#### `PUT /api/admin/users/owners/{id}`
- Parameters: `id` (path, string (uuid))
- Request body: `UpdateOwnerRequest`
- Responses: `200` → `ApiResponseOfOwnerUserResponse`

#### `PATCH /api/admin/users/owners/{id}/ban`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponse`

#### `PATCH /api/admin/users/owners/{id}/unban`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponse`

### Auth

#### `POST /api/auth/change-password`
- Parameters: None documented
- Request body: `ChangePasswordRequest`
- Responses: `200` → `ApiResponseOfboolean`

#### `POST /api/auth/check-email-exist`
- Parameters: None documented
- Request body: `CheckEmailRequest`
- Responses: `200` → `ApiResponseOfboolean`

#### `POST /api/auth/check-username-exist`
- Parameters: None documented
- Request body: `CheckUsernameRequest`
- Responses: `200` → `ApiResponseOfboolean`

#### `POST /api/auth/login`
- Parameters: None documented
- Request body: `AuthRequest`
- Responses: `200` → `ApiResponseOfAuthResponse`

#### `POST /api/auth/login-google`
- Parameters: None documented
- Request body: `GoogleLoginRequest`
- Responses: `200` → `ApiResponseOfAuthResponse`

#### `POST /api/auth/logout`
- Parameters: None documented
- Request body: `None`
- Responses: `200` → `ApiResponse`

#### `POST /api/auth/refresh-token`
- Parameters: None documented
- Request body: `None`
- Responses: `200` → `ApiResponseOfAuthResponse`

#### `POST /api/auth/register`
- Parameters: None documented
- Request body: `SignUpUserRequest`
- Responses: `200` → `ApiResponseOfUserResponse`

#### `POST /api/auth/resend-email-verification`
- Parameters: None documented
- Request body: `ResendEmailRequest`
- Responses: `200` → `ApiResponse`

#### `POST /api/auth/verify-email`
- Parameters: None documented
- Request body: `VerifyEmailRequest`
- Responses: `200` → `ApiResponseOfAuthResponse`

### ManagerUsers

#### `GET /api/manager/users`
- Parameters: `PageNumber` (query, ['integer', 'string']), `PageSize` (query, ['integer', 'string']), `Search` (query, string), `Role` (query, string), `BranchId` (query, string (uuid)), `IsActive` (query, boolean), `IsBanned` (query, boolean), `SortBy` (query, string), `SortDirection` (query, string)
- Request body: `None`
- Responses: `200` → `ApiResponseOfPagedResultOfManagerScopedUserResponse`

#### `POST /api/manager/users`
- Parameters: None documented
- Request body: `CreateManagedUserRequest`
- Responses: `200` → `ApiResponseOfManagerScopedUserResponse`

#### `PUT /api/manager/users/{id}`
- Parameters: `id` (path, string (uuid))
- Request body: `UpdateManagedUserRequest`
- Responses: `200` → `ApiResponseOfManagerScopedUserResponse`

#### `PATCH /api/manager/users/{id}/ban`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponse`

#### `PATCH /api/manager/users/{id}/unban`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponse`

### MeMenu

#### `GET /api/me/branches/{branchId}/menu`
- Parameters: `branchId` (path, string (uuid)), `PageNumber` (query, ['integer', 'string']), `PageSize` (query, ['integer', 'string']), `Search` (query, string), `IsActive` (query, boolean), `IsAvailable` (query, boolean), `IsFeatured` (query, boolean), `CategoryId` (query, string (uuid)), `SortBy` (query, string), `SortDirection` (query, string)
- Request body: `None`
- Responses: `200` → `ApiResponseOfPagedResultOfMenuCategoryResponse`

#### `PATCH /api/me/branches/{branchId}/menu-items/bulk-availability`
- Parameters: `branchId` (path, string (uuid))
- Request body: `BulkAvailabilityRequest`
- Responses: `200` → `ApiResponseOfIReadOnlyListOfMenuItemResponse`

#### `GET /api/me/menu-items/{id}`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfMenuItemResponse`

#### `PATCH /api/me/menu-items/{id}/toggle-available`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfMenuItemResponse`

### MyBranches

#### `GET /api/me/branches`
- Parameters: None documented
- Request body: `None`
- Responses: `200` → `ApiResponseOfIReadOnlyListOfBranchResponse`

#### `GET /api/me/branches/{id}`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfBranchResponse`

### OwnerBranches

#### `GET /api/owner/branches`
- Parameters: `PageNumber` (query, ['integer', 'string']), `PageSize` (query, ['integer', 'string']), `Search` (query, string), `IsActive` (query, boolean), `SortBy` (query, string), `SortDirection` (query, string)
- Request body: `None`
- Responses: `200` → `ApiResponseOfPagedResultOfBranchResponse`

#### `POST /api/owner/branches`
- Parameters: None documented
- Request body: `CreateBranchRequest`
- Responses: `200` → `ApiResponseOfBranchResponse`

#### `GET /api/owner/branches/{id}`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfBranchResponse`

#### `PUT /api/owner/branches/{id}`
- Parameters: `id` (path, string (uuid))
- Request body: `UpdateBranchRequest`
- Responses: `200` → `ApiResponseOfBranchResponse`

#### `PATCH /api/owner/branches/{id}/active`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfBranchResponse`

#### `PATCH /api/owner/branches/{id}/inactive`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfBranchResponse`

### OwnerMenu

#### `GET /api/owner/branches/{branchId}/categories`
- Parameters: `branchId` (path, string (uuid)), `PageNumber` (query, ['integer', 'string']), `PageSize` (query, ['integer', 'string']), `Search` (query, string), `IsActive` (query, boolean), `SortBy` (query, string), `SortDirection` (query, string)
- Request body: `None`
- Responses: `200` → `ApiResponseOfPagedResultOfCategoryResponse`

#### `POST /api/owner/branches/{branchId}/categories`
- Parameters: `branchId` (path, string (uuid))
- Request body: `CreateCategoryRequest`
- Responses: `200` → `ApiResponseOfCategoryResponse`

#### `PATCH /api/owner/branches/{branchId}/categories/reorder`
- Parameters: `branchId` (path, string (uuid))
- Request body: `ReorderCategoryRequest`
- Responses: `200` → `ApiResponseOfIReadOnlyListOfCategoryResponse`

#### `POST /api/owner/branches/{branchId}/categories/{categoryId}/menu-items`
- Parameters: `branchId` (path, string (uuid)), `categoryId` (path, string (uuid))
- Request body: `CreateMenuItemRequest`
- Responses: `200` → `ApiResponseOfMenuItemResponse`

#### `GET /api/owner/branches/{branchId}/categories/{id}`
- Parameters: `branchId` (path, string (uuid)), `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfCategoryResponse`

#### `PUT /api/owner/branches/{branchId}/categories/{id}`
- Parameters: `branchId` (path, string (uuid)), `id` (path, string (uuid))
- Request body: `UpdateCategoryRequest`
- Responses: `200` → `ApiResponseOfCategoryResponse`

#### `PATCH /api/owner/branches/{branchId}/categories/{id}/active`
- Parameters: `branchId` (path, string (uuid)), `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfCategoryResponse`

#### `PATCH /api/owner/branches/{branchId}/categories/{id}/inactive`
- Parameters: `branchId` (path, string (uuid)), `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfCategoryResponse`

#### `GET /api/owner/branches/{branchId}/menu-items`
- Parameters: `branchId` (path, string (uuid)), `PageNumber` (query, ['integer', 'string']), `PageSize` (query, ['integer', 'string']), `Search` (query, string), `IsActive` (query, boolean), `IsAvailable` (query, boolean), `IsFeatured` (query, boolean), `CategoryId` (query, string (uuid)), `SortBy` (query, string), `SortDirection` (query, string)
- Request body: `None`
- Responses: `200` → `ApiResponseOfPagedResultOfMenuItemResponse`

#### `PATCH /api/owner/branches/{branchId}/menu-items/bulk-availability`
- Parameters: `branchId` (path, string (uuid))
- Request body: `BulkAvailabilityRequest`
- Responses: `200` → `ApiResponseOfIReadOnlyListOfMenuItemResponse`

#### `PATCH /api/owner/branches/{branchId}/menu-items/reorder`
- Parameters: `branchId` (path, string (uuid))
- Request body: `ReorderMenuItemRequest`
- Responses: `200` → `ApiResponseOfIReadOnlyListOfMenuItemResponse`

#### `GET /api/owner/menu-items/{id}`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfMenuItemResponse`

#### `PUT /api/owner/menu-items/{id}`
- Parameters: `id` (path, string (uuid))
- Request body: `UpdateMenuItemRequest`
- Responses: `200` → `ApiResponseOfMenuItemResponse`

#### `PATCH /api/owner/menu-items/{id}/active`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfMenuItemResponse`

#### `PATCH /api/owner/menu-items/{id}/inactive`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfMenuItemResponse`

#### `PATCH /api/owner/menu-items/{id}/price`
- Parameters: `id` (path, string (uuid))
- Request body: `UpdateMenuItemPriceRequest`
- Responses: `200` → `ApiResponseOfMenuItemResponse`

#### `GET /api/owner/menu-items/{id}/price-history`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfIReadOnlyListOfPriceHistoryResponse`

#### `PATCH /api/owner/menu-items/{id}/toggle-available`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfMenuItemResponse`

#### `PATCH /api/owner/menu-items/{id}/toggle-featured`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfMenuItemResponse`

### OwnerRestaurant

#### `GET /api/owner/restaurant/me`
- Parameters: None documented
- Request body: `None`
- Responses: `200` → `ApiResponseOfRestaurantResponse`

#### `PUT /api/owner/restaurant/me`
- Parameters: None documented
- Request body: `UpdateRestaurantRequest`
- Responses: `200` → `ApiResponseOfRestaurantResponse`

### OwnerUsers

#### `GET /api/owner/users`
- Parameters: `PageNumber` (query, ['integer', 'string']), `PageSize` (query, ['integer', 'string']), `Search` (query, string), `Role` (query, string), `BranchId` (query, string (uuid)), `IsActive` (query, boolean), `IsBanned` (query, boolean), `SortBy` (query, string), `SortDirection` (query, string)
- Request body: `None`
- Responses: `200` → `ApiResponseOfPagedResultOfOwnerScopedUserResponse`

#### `POST /api/owner/users`
- Parameters: None documented
- Request body: `CreateManagedUserRequest`
- Responses: `200` → `ApiResponseOfOwnerScopedUserResponse`

#### `PUT /api/owner/users/{id}`
- Parameters: `id` (path, string (uuid))
- Request body: `UpdateManagedUserRequest`
- Responses: `200` → `ApiResponseOfOwnerScopedUserResponse`

#### `PATCH /api/owner/users/{id}/ban`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponse`

#### `PATCH /api/owner/users/{id}/unban`
- Parameters: `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponse`

### PublicMenu

#### `GET /api/public/branches/{branchId}/categories`
- Parameters: `branchId` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfIReadOnlyListOfCategoryResponse`

#### `GET /api/public/branches/{branchId}/menu`
- Parameters: `branchId` (path, string (uuid)), `PageNumber` (query, ['integer', 'string']), `PageSize` (query, ['integer', 'string']), `Search` (query, string), `IsActive` (query, boolean), `IsAvailable` (query, boolean), `IsFeatured` (query, boolean), `CategoryId` (query, string (uuid)), `SortBy` (query, string), `SortDirection` (query, string)
- Request body: `None`
- Responses: `200` → `ApiResponseOfPagedResultOfMenuCategoryResponse`

#### `GET /api/public/branches/{branchId}/menu-items/{id}`
- Parameters: `branchId` (path, string (uuid)), `id` (path, string (uuid))
- Request body: `None`
- Responses: `200` → `ApiResponseOfMenuItemResponse`

### WeatherForecast

#### `GET /WeatherForecast`
- Purpose: GetWeatherForecast
- Parameters: None documented
- Request body: `None`
- Responses: `200` → `WeatherForecast[]`

## DTO reference

### `AuthRequest`
- `identifier`: `string`
- `password`: `string`

### `AuthResponse`
- `user?`: `object`
- `accessToken?`: `string`

### `UserResponse`
- `id?`: `string (uuid)`
- `email?`: `string`
- `username?`: `string`
- `fullName?`: `string`
- `avatarUrl?`: `['null', 'string']`
- `role?`: `string`
- `isEmailVerified?`: `boolean`
- `isActive?`: `boolean`
- `createdAt?`: `string (date-time)`
- `updatedAt?`: `['null', 'string']`

### `OwnerUserResponse`
- `userId?`: `string (uuid)`
- `fullName?`: `string`
- `username?`: `string`
- `email?`: `string`
- `phoneNumber?`: `['null', 'string']`
- `isActive?`: `boolean`
- `isBanned?`: `boolean`
- `restaurantId?`: `['null', 'string']`
- `restaurantName?`: `['null', 'string']`
- `createdAt?`: `string (date-time)`

### `OwnerScopedUserResponse`
- `userId?`: `string (uuid)`
- `fullName?`: `string`
- `username?`: `string`
- `email?`: `string`
- `phoneNumber?`: `['null', 'string']`
- `role?`: `string`
- `restaurantId?`: `string (uuid)`
- `restaurantName?`: `string`
- `branchIds?`: `string (uuid)[]`
- `branchNames?`: `string[]`
- `isActive?`: `boolean`
- `isBanned?`: `boolean`
- `createdAt?`: `string (date-time)`

### `ManagerScopedUserResponse`
- `userId?`: `string (uuid)`
- `fullName?`: `string`
- `username?`: `string`
- `email?`: `string`
- `phoneNumber?`: `['null', 'string']`
- `role?`: `string`
- `branchIds?`: `string (uuid)[]`
- `branchNames?`: `string[]`
- `isActive?`: `boolean`
- `isBanned?`: `boolean`
- `createdAt?`: `string (date-time)`

### `SignUpUserRequest`
- `email`: `string`
- `username`: `string`
- `fullName`: `string`
- `password`: `string`

### `GoogleLoginRequest`
- `idToken?`: `string`

### `CheckEmailRequest`
- `email`: `string`

### `CheckUsernameRequest`
- `username`: `string`

### `ChangePasswordRequest`
- `currentPassword`: `string`
- `newPassword`: `string`

### `ResendEmailRequest`
- `email`: `string`

### `VerifyEmailRequest`
- `userId`: `string`
- `token`: `string`

### `RestaurantResponse`
- `restaurantId?`: `string (uuid)`
- `ownerId?`: `string (uuid)`
- `ownerName?`: `string`
- `ownerEmail?`: `string`
- `ownerPhone?`: `['null', 'string']`
- `name?`: `string`
- `slug?`: `string`
- `logoUrl?`: `['null', 'string']`
- `description?`: `['null', 'string']`
- `totalBranches?`: `['integer', 'string']`
- `isActive?`: `boolean`
- `createdAt?`: `string (date-time)`
- `updatedAt?`: `['null', 'string']`

### `CreateRestaurantRequest`
- `ownerId?`: `string (uuid)`
- `name?`: `string`
- `slug?`: `string`
- `logoUrl?`: `['null', 'string']`
- `description?`: `['null', 'string']`

### `UpdateRestaurantRequest`
- `name?`: `string`
- `slug?`: `string`
- `logoUrl?`: `['null', 'string']`
- `description?`: `['null', 'string']`

### `BranchResponse`
- `branchId?`: `string (uuid)`
- `restaurantId?`: `string (uuid)`
- `managerId?`: `['null', 'string']`
- `managerName?`: `['null', 'string']`
- `name?`: `string`
- `slug?`: `string`
- `address?`: `['null', 'string']`
- `phone?`: `['null', 'string']`
- `email?`: `['null', 'string']`
- `openTime?`: `['null', 'string']`
- `closeTime?`: `['null', 'string']`
- `isActive?`: `boolean`
- `vatPercent?`: `['number', 'string']`
- `serviceChargePercent?`: `['number', 'string']`
- `serviceChargeFixed?`: `['number', 'string']`
- `createdAt?`: `string (date-time)`
- `updatedAt?`: `['null', 'string']`

### `CreateBranchRequest`
- `name?`: `string`
- `slug?`: `string`
- `address?`: `['null', 'string']`
- `phone?`: `['null', 'string']`
- `email?`: `['null', 'string']`
- `openTime?`: `['null', 'string']`
- `closeTime?`: `['null', 'string']`
- `vatPercent?`: `['number', 'string']`
- `serviceChargePercent?`: `['number', 'string']`
- `serviceChargeFixed?`: `['number', 'string']`

### `UpdateBranchRequest`
- `name?`: `string`
- `slug?`: `string`
- `address?`: `['null', 'string']`
- `phone?`: `['null', 'string']`
- `email?`: `['null', 'string']`
- `openTime?`: `['null', 'string']`
- `closeTime?`: `['null', 'string']`
- `vatPercent?`: `['number', 'string']`
- `serviceChargePercent?`: `['number', 'string']`
- `serviceChargeFixed?`: `['number', 'string']`

### `CategoryResponse`
- `categoryId?`: `string (uuid)`
- `branchId?`: `string (uuid)`
- `branchName?`: `['null', 'string']`
- `name?`: `string`
- `description?`: `['null', 'string']`
- `imageUrl?`: `['null', 'string']`
- `displayOrder?`: `['integer', 'string']`
- `isActive?`: `boolean`
- `createdAt?`: `string (date-time)`
- `updatedAt?`: `['null', 'string']`

### `CreateCategoryRequest`
- `name?`: `string`
- `description?`: `['null', 'string']`
- `imageUrl?`: `['null', 'string']`
- `displayOrder?`: `['integer', 'string']`

### `UpdateCategoryRequest`
- `name?`: `string`
- `description?`: `['null', 'string']`
- `imageUrl?`: `['null', 'string']`
- `displayOrder?`: `['integer', 'string']`

### `MenuItemResponse`
- `menuItemId?`: `string (uuid)`
- `branchId?`: `string (uuid)`
- `branchName?`: `['null', 'string']`
- `categoryId?`: `string (uuid)`
- `categoryName?`: `['null', 'string']`
- `name?`: `string`
- `description?`: `['null', 'string']`
- `imageUrl?`: `['null', 'string']`
- `price?`: `['number', 'string']`
- `costPrice?`: `['number', 'string']`
- `preparationTime?`: `['integer', 'string']`
- `displayOrder?`: `['integer', 'string']`
- `isAvailable?`: `boolean`
- `isFeatured?`: `boolean`
- `isActive?`: `boolean`
- `createdAt?`: `string (date-time)`
- `updatedAt?`: `['null', 'string']`

### `CreateMenuItemRequest`
- `name?`: `string`
- `description?`: `['null', 'string']`
- `imageUrl?`: `['null', 'string']`
- `price?`: `['number', 'string']`
- `costPrice?`: `['number', 'string']`
- `preparationTime?`: `['integer', 'string']`
- `displayOrder?`: `['integer', 'string']`
- `isAvailable?`: `boolean`
- `isFeatured?`: `boolean`

### `UpdateMenuItemRequest`
- `categoryId?`: `string (uuid)`
- `name?`: `string`
- `description?`: `['null', 'string']`
- `imageUrl?`: `['null', 'string']`
- `costPrice?`: `['number', 'string']`
- `preparationTime?`: `['integer', 'string']`
- `displayOrder?`: `['integer', 'string']`
- `isAvailable?`: `boolean`
- `isFeatured?`: `boolean`

### `UpdateMenuItemPriceRequest`
- `price?`: `['number', 'string']`
- `note?`: `['null', 'string']`

### `PriceHistoryResponse`
- `priceHistoryId?`: `string (uuid)`
- `menuItemId?`: `string (uuid)`
- `oldPrice?`: `['number', 'string']`
- `newPrice?`: `['number', 'string']`
- `changedById?`: `string (uuid)`
- `changedByName?`: `['null', 'string']`
- `changedAt?`: `string (date-time)`
- `note?`: `['null', 'string']`

### `MenuCategoryResponse`
- `categoryId?`: `string (uuid)`
- `categoryName?`: `string`
- `displayOrder?`: `['integer', 'string']`
- `items?`: `MenuItemResponse[]`

### `BulkAvailabilityRequest`
- `isAvailable?`: `boolean`
- `menuItemIds?`: `string (uuid)[]`

### `ReorderCategoryRequest`
- `items?`: `ReorderItemRequest[]`

### `ReorderMenuItemRequest`
- `items?`: `ReorderItemRequest[]`

### `ReorderItemRequest`
- `id?`: `string (uuid)`
- `displayOrder?`: `['integer', 'string']`

### `CreateOwnerRequest`
- `fullName?`: `string`
- `username?`: `string`
- `email?`: `string`
- `phoneNumber?`: `['null', 'string']`
- `password?`: `string`

### `UpdateOwnerRequest`
- `fullName?`: `string`
- `username?`: `string`
- `email?`: `string`
- `phoneNumber?`: `['null', 'string']`

### `CreateManagedUserRequest`
- `fullName?`: `string`
- `username?`: `string`
- `email?`: `string`
- `phoneNumber?`: `['null', 'string']`
- `password?`: `string`
- `role?`: `string`
- `branchIds?`: `string (uuid)[]`

### `UpdateManagedUserRequest`
- `fullName?`: `string`
- `username?`: `string`
- `email?`: `string`
- `phoneNumber?`: `['null', 'string']`
- `role?`: `string`
- `branchIds?`: `string (uuid)[]`

## Frontend mappings and known mismatches

- `src/services/auth.ts` currently consumes `/api/auth/login`, `/api/auth/refresh-token`, and `/api/auth/logout`.
- `src/hooks/queries/useOwnerUsersQuery.tsx` consumes `GET /api/owner/users` and expects `ApiResponse<PagedResult<OwnerScopedUserResponse>>`.
- `src/hooks/queries/useManagerUsersQuery.tsx` consumes `GET /api/manager/users` and `GET /api/me/branches`.
- `src/hooks/queries/useOwnerBranchesQuery.tsx` consumes `GET /api/owner/branches` and selects `result.items`.
- `src/hooks/mutations/useOwnerUserMutations.tsx` consumes owner user create/update/ban/unban endpoints.
- `src/hooks/mutations/useManagerUserMutations.tsx` consumes manager user create/update/ban/unban endpoints.
- Local envelope variance: `src/types/api.ts` models `code` as optional and includes `statusCode`, while the published OpenAPI examples emphasize `result`, `code`, and `message`.
- Local auth naming variance: `src/types/auth.ts` uses `AuthUser.id`, while several other backend DTOs use names like `userId`, `branchId`, `restaurantId`, or `menuItemId`.
- Import-path variance exists in the frontend: some manager files import `ApiResponse`/`PagedResult` from `@/types/commons` while other files use `@/types/api`.
