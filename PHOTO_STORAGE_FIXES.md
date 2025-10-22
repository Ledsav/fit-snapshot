# Photo Storage and Camera Fixes

## Issues Fixed

### 1. Permanent Photo Storage
**Problem**: Photos were only stored in app cache (AsyncStorage), not permanently saved to device.

**Solution**: 
- Photos are now saved to a dedicated subfolder: `FitSnapshot/photos/`
- Uses `expo-file-system` for permanent storage
- Optionally saves to device photo library with `expo-media-library`
- Added automatic migration for existing cached photos

**Changes Made**:
- Updated `photoStorage.ts` with new storage functions
- Added file system operations for permanent storage
- Created `photoMigration.ts` for seamless migration
- Updated `PhotoContext.tsx` to handle new storage system

### 2. Camera Black Screen Fix
**Problem**: Camera sometimes starts black, requiring camera switch to activate.

**Solution**:
- Enhanced camera initialization with proper timing
- Added force refresh mechanism for camera issues
- Implemented better error handling and auto-retry
- Added camera key-based re-rendering for problematic states

**Changes Made**:
- Improved camera state management in `camera.tsx`
- Added `forceRefreshCamera()` function
- Enhanced camera ready detection
- Added manual refresh button for users

## New Features Added

### Storage Management Component
- View total photos and storage usage
- See storage directory path
- Manual cleanup of orphaned files
- Refresh storage information
- Added to Settings screen

### Automatic Migration
- Existing photos automatically migrated to permanent storage
- No data loss during transition
- One-time migration process
- Cleanup of old cache files

## File Structure Changes

```
services/
├── photoStorage.ts (enhanced)
├── photoMigration.ts (new)
components/settings/
├── StorageManager.tsx (new)
```

## Storage Location

Photos are now stored in:
- **App Directory**: `[DocumentDirectory]/FitSnapshot/photos/`
- **Device Library**: Also saved to user's photo library (with permission)
- **Filename Format**: `{type}_{timestamp}_{id}.jpg`

## Migration Process

1. On first app launch after update, migration runs automatically
2. Existing photos copied from cache to permanent storage
3. Photo metadata updated with new file paths
4. Migration marked complete to prevent re-running

## User Benefits

1. **Permanent Storage**: Photos persist even if app cache is cleared
2. **Device Library**: Photos accessible through device gallery
3. **Better Organization**: Dedicated app folder for easy management
4. **Storage Insights**: See how much space photos are using
5. **Reliable Camera**: Fixes black screen camera issues
6. **Cleanup Tools**: Remove orphaned files to free space

## Technical Details

- Uses Expo File System for permanent storage
- Maintains backward compatibility during migration
- Proper error handling for storage operations
- Automatic cleanup of temporary files
- Enhanced camera initialization timing
- Force refresh capability for camera issues

The app now provides a much more robust photo storage system with permanent file storage and improved camera reliability.