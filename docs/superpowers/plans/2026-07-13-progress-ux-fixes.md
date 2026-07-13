# Progress & Gallery UX Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four UX issues in the fit-snapshot Expo app: no gallery delete confirmation, an unlabeled icon-only comparison-mode switcher, a mislabeled home-screen stat, and a cramped/low-value side-by-side comparison mode — while ungating side-by-side and grid comparison for free-tier users.

**Architecture:** Targeted edits across existing screens/components (`gallery.tsx`, `PhotoMorph.tsx`, `progress.tsx`, `index.tsx`, `ProgressSummary.tsx`), one new component (`SyncedZoomPair.tsx`) using `react-native-gesture-handler` + `react-native-reanimated` for synchronized pinch-zoom/pan, plus a data-only change to `config/features.json`.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, `react-native-gesture-handler` (newly added explicit dependency), `react-native-reanimated` (already a dependency), the project's own `LocalizationContext`/`translations.ts` i18n system.

## Global Constraints

- Source spec: `docs/superpowers/specs/2026-07-13-progress-ux-fixes-design.md` — every task below implements a numbered section of that spec.
- No RN component/screen test harness exists in this repo (`jest`/`jest-expo` are configured but there is no `@testing-library/react-native` and zero existing test files outside `node_modules`). Do **not** add a testing harness as part of this work — it's out of scope. Each task's verification step is (a) `npx tsc --noEmit` for type safety and (b) a specific manual check via the running app, per the project's `verify` skill / CLAUDE.md instruction to exercise UI changes before calling them done.
- All user-facing copy must go through the existing `t()` / `translations.ts` system, added to all 5 locale blocks (`en`, `es`, `it`, `de`, `fr`) in the order they appear in the file. `t()` does **not** support placeholder interpolation (confirmed by reading `context/LocalizationContext.tsx`) — do not invent `{count}`-style templating; build interpolated strings by concatenation instead.
- `common.cancel` already exists in all 5 locales — reuse it, do not add a duplicate cancel key.
- Match existing code style: 2-space indentation, double quotes for JSX string props, existing `Colors`/`DesignSystem` token imports where a file already uses them.
- Run every `tsc`/manual-check command from the repo root: `C:\Users\AlbertoValdesRey\Desktop\Projects\personal\fit-snapshot`.

---

### Task 1: Add gesture-handler dependency and wrap app root

**Files:**
- Modify: `package.json` (via `expo install`, not hand-edited)
- Modify: `app/_layout.tsx`

**Interfaces:**
- Produces: a `GestureHandlerRootView` wrapping the entire app, required by `GestureDetector` used in Task 5's `SyncedZoomPair`. Any later task using `react-native-gesture-handler` gestures depends on this being in place.

- [ ] **Step 1: Install the correct Expo-compatible version of react-native-gesture-handler**

`react-native-gesture-handler` is currently only a *transitive* dependency (pulled in by `expo-router`/`react-navigation`). Use `expo install` so it's pinned to the exact version Expo SDK 57 expects, rather than hand-picking a semver range:

Run: `npx expo install react-native-gesture-handler`
Expected: command completes, and `package.json` now has an explicit `"react-native-gesture-handler": "..."` line under `"dependencies"`.

- [ ] **Step 2: Verify the dependency was added**

Run: `grep -n "react-native-gesture-handler" package.json`
Expected: one line under `dependencies` (not just inside `node_modules`).

- [ ] **Step 3: Add the gesture-handler entry import and root wrapper**

In `app/_layout.tsx`, the current top of the file reads:

```tsx
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "expo-router/react-navigation";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
```

Replace it with:

```tsx
import "react-native-gesture-handler";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "expo-router/react-navigation";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
```

- [ ] **Step 4: Wrap the root return value**

The current `RootLayoutNav` return reads:

```tsx
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <LocalizationProvider>
          <AppThemeProvider>
            <UserProvider>
              <PhotoProvider>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                </Stack>
              </PhotoProvider>
            </UserProvider>
          </AppThemeProvider>
        </LocalizationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

Replace it with:

```tsx
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <LocalizationProvider>
            <AppThemeProvider>
              <UserProvider>
                <PhotoProvider>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                  </Stack>
                </PhotoProvider>
              </UserProvider>
            </AppThemeProvider>
          </LocalizationProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors (baseline before this plan is a clean `tsc --noEmit`).

- [ ] **Step 6: Manual check**

Run: `npx expo start`, open the app on a simulator/device/web, and confirm the app boots to the home screen exactly as before (this step only adds a wrapper view — no visual change is expected yet).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json app/_layout.tsx
git commit -m "chore: add react-native-gesture-handler and wrap app in GestureHandlerRootView"
```

---

### Task 2: Gallery delete confirmation

**Files:**
- Modify: `localization/translations.ts`
- Modify: `app/(tabs)/gallery.tsx`

**Interfaces:**
- Consumes: `common.cancel` (existing key, all locales), `gallery.deletePhoto` (existing key, all locales).
- Produces: new keys `gallery.deleteConfirmMessage`, `gallery.deleteBulkConfirmMessage` (all locales) — not consumed elsewhere in this plan.

- [ ] **Step 1: Add new keys to the TranslationKeys interface**

In `localization/translations.ts`, the `gallery` block of the `TranslationKeys` interface (around line 43) currently reads:

```ts
  gallery: {
    title: string;
    deletePhoto: string;
    selectPhotoType: string;
    loading: string;
    grouped: string;
    timeline: string;
    selected: string;
    delete: string;
    selectAll: string;
    deselectAll: string;
  };
```

Replace with:

```ts
  gallery: {
    title: string;
    deletePhoto: string;
    selectPhotoType: string;
    loading: string;
    grouped: string;
    timeline: string;
    selected: string;
    delete: string;
    selectAll: string;
    deselectAll: string;
    deleteConfirmMessage: string;
    deleteBulkConfirmMessage: string;
  };
```

- [ ] **Step 2: Add English values**

The `en.gallery` block currently reads:

```ts
    gallery: {
      title: "Gallery",
      deletePhoto: "Delete Photo",
      selectPhotoType: "Select Photo Type",
      loading: "Loading...",
      grouped: "Grouped",
      timeline: "Timeline",
      selected: "selected",
      delete: "Delete",
      selectAll: "Select All",
      deselectAll: "Deselect All",
    },
```

Replace with:

```ts
    gallery: {
      title: "Gallery",
      deletePhoto: "Delete Photo",
      selectPhotoType: "Select Photo Type",
      loading: "Loading...",
      grouped: "Grouped",
      timeline: "Timeline",
      selected: "selected",
      delete: "Delete",
      selectAll: "Select All",
      deselectAll: "Deselect All",
      deleteConfirmMessage: "This photo will be permanently deleted. This can't be undone.",
      deleteBulkConfirmMessage: "selected photos will be permanently deleted. This can't be undone.",
    },
```

- [ ] **Step 3: Add Spanish values**

The `es.gallery` block currently reads:

```ts
    gallery: {
      title: "Galería",
      deletePhoto: "Eliminar Foto",
      selectPhotoType: "Seleccionar Tipo de Foto",
      loading: "Cargando...",
      grouped: "Agrupado",
      timeline: "Línea de Tiempo",
      selected: "seleccionado",
      delete: "Eliminar",
      selectAll: "Seleccionar Todo",
      deselectAll: "Deseleccionar Todo",
    },
```

Replace with:

```ts
    gallery: {
      title: "Galería",
      deletePhoto: "Eliminar Foto",
      selectPhotoType: "Seleccionar Tipo de Foto",
      loading: "Cargando...",
      grouped: "Agrupado",
      timeline: "Línea de Tiempo",
      selected: "seleccionado",
      delete: "Eliminar",
      selectAll: "Seleccionar Todo",
      deselectAll: "Deseleccionar Todo",
      deleteConfirmMessage: "Esta foto se eliminará permanentemente. Esta acción no se puede deshacer.",
      deleteBulkConfirmMessage: "fotos seleccionadas se eliminarán permanentemente. Esta acción no se puede deshacer.",
    },
```

- [ ] **Step 4: Add Italian values**

The `it.gallery` block currently reads:

```ts
    gallery: {
      title: "Galleria",
      deletePhoto: "Elimina Foto",
      selectPhotoType: "Seleziona Tipo di Foto",
      loading: "Caricamento...",
      grouped: "Raggruppato",
      timeline: "Timeline",
      selected: "selezionato",
      delete: "Elimina",
      selectAll: "Seleziona Tutto",
      deselectAll: "Deseleziona Tutto",
    },
```

Replace with:

```ts
    gallery: {
      title: "Galleria",
      deletePhoto: "Elimina Foto",
      selectPhotoType: "Seleziona Tipo di Foto",
      loading: "Caricamento...",
      grouped: "Raggruppato",
      timeline: "Timeline",
      selected: "selezionato",
      delete: "Elimina",
      selectAll: "Seleziona Tutto",
      deselectAll: "Deseleziona Tutto",
      deleteConfirmMessage: "Questa foto verrà eliminata definitivamente. Questa azione non può essere annullata.",
      deleteBulkConfirmMessage: "foto selezionate verranno eliminate definitivamente. Questa azione non può essere annullata.",
    },
```

- [ ] **Step 5: Add German values**

The `de.gallery` block currently reads:

```ts
    gallery: {
      title: "Galerie",
      deletePhoto: "Foto löschen",
      selectPhotoType: "Fototyp auswählen",
      loading: "Lädt...",
      grouped: "Gruppiert",
      timeline: "Zeitstrahl",
      selected: "ausgewählt",
      delete: "Löschen",
      selectAll: "Alle Auswählen",
      deselectAll: "Alle Abwählen",
    },
```

Replace with:

```ts
    gallery: {
      title: "Galerie",
      deletePhoto: "Foto löschen",
      selectPhotoType: "Fototyp auswählen",
      loading: "Lädt...",
      grouped: "Gruppiert",
      timeline: "Zeitstrahl",
      selected: "ausgewählt",
      delete: "Löschen",
      selectAll: "Alle Auswählen",
      deselectAll: "Alle Abwählen",
      deleteConfirmMessage: "Dieses Foto wird dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.",
      deleteBulkConfirmMessage: "ausgewählte Fotos werden dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.",
    },
```

- [ ] **Step 6: Add French values**

The `fr.gallery` block currently reads:

```ts
    gallery: {
      title: "Galerie",
      deletePhoto: "Supprimer la Photo",
      selectPhotoType: "Sélectionner le Type de Photo",
      loading: "Chargement...",
      grouped: "Groupé",
      timeline: "Chronologie",
      selected: "sélectionné",
      delete: "Supprimer",
      selectAll: "Tout Sélectionner",
      deselectAll: "Tout Désélectionner",
    },
```

Replace with:

```ts
    gallery: {
      title: "Galerie",
      deletePhoto: "Supprimer la Photo",
      selectPhotoType: "Sélectionner le Type de Photo",
      loading: "Chargement...",
      grouped: "Groupé",
      timeline: "Chronologie",
      selected: "sélectionné",
      delete: "Supprimer",
      selectAll: "Tout Sélectionner",
      deselectAll: "Tout Désélectionner",
      deleteConfirmMessage: "Cette photo sera définitivement supprimée. Cette action est irréversible.",
      deleteBulkConfirmMessage: "photos sélectionnées seront définitivement supprimées. Cette action est irréversible.",
    },
```

- [ ] **Step 7: Type-check the translations file in isolation**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 8: Add `Alert` to gallery.tsx's react-native import**

In `app/(tabs)/gallery.tsx`, the current import reads:

```tsx
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
```

Replace with:

```tsx
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
```

- [ ] **Step 9: Confirm single-photo delete before deleting**

In `app/(tabs)/gallery.tsx`, the current handler reads:

```tsx
  const handleDeletePhoto = async (id: string) => {
    await removePhoto(id);
    
  };
```

Replace with:

```tsx
  const handleDeletePhoto = (id: string) => {
    Alert.alert(
      t("gallery.deletePhoto"),
      t("gallery.deleteConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("gallery.delete"),
          style: "destructive",
          onPress: async () => {
            await removePhoto(id);
          },
        },
      ]
    );
  };
```

- [ ] **Step 10: Confirm bulk delete before deleting**

The current handler reads:

```tsx
  const handleBulkDelete = async () => {
    if (selectedPhotoIds.size === 0) return;

    for (const id of selectedPhotoIds) {
      await removePhoto(id);
    }
    setSelectedPhotoIds(new Set());
    setSelectionMode(false);
  };
```

Replace with:

```tsx
  const handleBulkDelete = () => {
    if (selectedPhotoIds.size === 0) return;

    const count = selectedPhotoIds.size;
    Alert.alert(
      t("gallery.deletePhoto"),
      `${count} ${t("gallery.deleteBulkConfirmMessage")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("gallery.delete"),
          style: "destructive",
          onPress: async () => {
            for (const id of selectedPhotoIds) {
              await removePhoto(id);
            }
            setSelectedPhotoIds(new Set());
            setSelectionMode(false);
          },
        },
      ]
    );
  };
```

- [ ] **Step 11: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 12: Manual check**

Run: `npx expo start`, open Gallery with at least 2 photos present (take/import test photos first if the gallery is empty). Tap the small "×" delete button on a single photo — confirm a native alert appears with Cancel/Delete, Cancel leaves the photo in place, Delete removes it. Then enable selection mode, select 2+ photos, tap the bulk-delete trash icon — confirm the alert shows the correct count and behaves the same way.

- [ ] **Step 13: Commit**

```bash
git add localization/translations.ts "app/(tabs)/gallery.tsx"
git commit -m "fix: require confirmation before deleting photos in gallery"
```

---

### Task 3: Home "consistency" metric rename

**Files:**
- Modify: `localization/translations.ts`
- Modify: `app/(tabs)/index.tsx`
- Modify: `components/home/ProgressSummary.tsx`

**Interfaces:**
- Produces: `ProgressSummaryProps.consistency: number` (renamed from `improvement`) — replaces the old prop name; no other file consumes `ProgressSummary` besides `index.tsx`.

- [ ] **Step 1: Rename the interface field**

In `localization/translations.ts`, the `progressSummary` block of the `TranslationKeys` interface (around line 160) currently reads:

```ts
  progressSummary: {
    days: string;
    photos: string;
    active: string;
  };
```

Replace with:

```ts
  progressSummary: {
    days: string;
    photos: string;
    consistency: string;
  };
```

- [ ] **Step 2: Update English value**

`en.progressSummary` currently reads:

```ts
    progressSummary: {
      days: "days",
      photos: "photos",
      active: "active",
    },
```

Replace with:

```ts
    progressSummary: {
      days: "days",
      photos: "photos",
      consistency: "consistency",
    },
```

- [ ] **Step 3: Update Spanish value**

`es.progressSummary` currently reads:

```ts
    progressSummary: {
      days: "días",
      photos: "fotos",
      active: "activo",
    },
```

Replace with:

```ts
    progressSummary: {
      days: "días",
      photos: "fotos",
      consistency: "consistencia",
    },
```

- [ ] **Step 4: Update Italian value**

`it.progressSummary` currently reads:

```ts
    progressSummary: {
      days: "giorni",
      photos: "foto",
      active: "attivo",
    },
```

Replace with:

```ts
    progressSummary: {
      days: "giorni",
      photos: "foto",
      consistency: "costanza",
    },
```

- [ ] **Step 5: Update German value**

`de.progressSummary` currently reads:

```ts
    progressSummary: {
      days: "Tage",
      photos: "Fotos",
      active: "aktiv",
    },
```

Replace with:

```ts
    progressSummary: {
      days: "Tage",
      photos: "Fotos",
      consistency: "Konsistenz",
    },
```

- [ ] **Step 6: Update French value**

`fr.progressSummary` currently reads:

```ts
    progressSummary: {
      days: "jours",
      photos: "photos",
      active: "actif",
    },
```

Replace with:

```ts
    progressSummary: {
      days: "jours",
      photos: "photos",
      consistency: "constance",
    },
```

- [ ] **Step 7: Rename the prop and display in ProgressSummary.tsx**

`components/home/ProgressSummary.tsx` currently reads:

```tsx
type ProgressSummaryProps = {
  totalDays: number;
  totalPhotos: number;
  improvement: number;
};

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  totalDays,
  totalPhotos,
  improvement,
}) => {
```

Replace with:

```tsx
type ProgressSummaryProps = {
  totalDays: number;
  totalPhotos: number;
  consistency: number;
};

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  totalDays,
  totalPhotos,
  consistency,
}) => {
```

Further down in the same file, this block:

```tsx
      <View style={styles.summaryItem}>
        <Ionicons name="trending-up-outline" size={iconSize.md} color={theme.text} />
        <Text style={[styles.summaryText, { color: theme.text }]}>
          {improvement.toFixed(0)}% {t("progressSummary.active")}
        </Text>
      </View>
```

Replace with:

```tsx
      <View style={styles.summaryItem}>
        <Ionicons name="trending-up-outline" size={iconSize.md} color={theme.text} />
        <Text style={[styles.summaryText, { color: theme.text }]}>
          {consistency.toFixed(0)}% {t("progressSummary.consistency")}
        </Text>
      </View>
```

- [ ] **Step 8: Rename the variable and prop usage in index.tsx**

`app/(tabs)/index.tsx` currently reads:

```tsx
  const totalPhotos = photos.length;
  const totalExpectedPhotos = totalDays * 3;
  const improvement = Math.min(
    100,
    Math.round((totalPhotos / totalExpectedPhotos) * 100)
  );
```

Replace with:

```tsx
  const totalPhotos = photos.length;
  const totalExpectedPhotos = totalDays * 3;
  const consistency = Math.min(
    100,
    Math.round((totalPhotos / totalExpectedPhotos) * 100)
  );
```

Further down, this block:

```tsx
            <ProgressSummary
              totalDays={totalDays}
              totalPhotos={totalPhotos}
              improvement={improvement}
            />
```

Replace with:

```tsx
            <ProgressSummary
              totalDays={totalDays}
              totalPhotos={totalPhotos}
              consistency={consistency}
            />
```

- [ ] **Step 9: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors (this specifically catches any stale `improvement` prop references).

- [ ] **Step 10: Manual check**

Run: `npx expo start`, open the Home tab, confirm the stats card shows "X% consistency" instead of "X% active" and the value is unchanged from before (same formula).

- [ ] **Step 11: Commit**

```bash
git add localization/translations.ts "app/(tabs)/index.tsx" components/home/ProgressSummary.tsx
git commit -m "fix: rename misleading 'active' stat to 'consistency' on home screen"
```

---

### Task 4: Progress mode switcher — labeled pills

**Files:**
- Modify: `localization/translations.ts`
- Modify: `components/progress/PhotoMorph.tsx`

**Interfaces:**
- Produces: new translation keys `progress.modeSlider`, `progress.modeSideBySide`, `progress.modeGif`, `progress.modeGrid`, `progress.modeSelect` — consumed only within this task's `PhotoMorph.tsx` change.

- [ ] **Step 1: Add new keys to the TranslationKeys interface**

In `localization/translations.ts`, the `progress` block of the interface (around line 55) currently ends with:

```ts
    gifAuthRequired: string;
    gifGoToSettings: string;
  };
```

Replace with:

```ts
    gifAuthRequired: string;
    gifGoToSettings: string;
    modeSlider: string;
    modeSideBySide: string;
    modeGif: string;
    modeGrid: string;
    modeSelect: string;
  };
```

- [ ] **Step 2: Add English values**

`en.progress` currently ends with:

```ts
      gifAuthRequired: "Sign in required to generate GIFs",
      gifGoToSettings: "Go to Settings to Sign In",
    },
```

Replace with:

```ts
      gifAuthRequired: "Sign in required to generate GIFs",
      gifGoToSettings: "Go to Settings to Sign In",
      modeSlider: "Slider",
      modeSideBySide: "Side-by-side",
      modeGif: "GIF",
      modeGrid: "Grid",
      modeSelect: "Select photos",
    },
```

- [ ] **Step 3: Add Spanish values**

`es.progress` currently ends with:

```ts
      gifAuthRequired: "Se requiere iniciar sesión para generar GIFs",
      gifGoToSettings: "Ir a Configuración para Iniciar Sesión",
    },
```

Replace with:

```ts
      gifAuthRequired: "Se requiere iniciar sesión para generar GIFs",
      gifGoToSettings: "Ir a Configuración para Iniciar Sesión",
      modeSlider: "Deslizador",
      modeSideBySide: "Lado a lado",
      modeGif: "GIF",
      modeGrid: "Cuadrícula",
      modeSelect: "Seleccionar fotos",
    },
```

- [ ] **Step 4: Add Italian values**

`it.progress` currently ends with:

```ts
      gifAuthRequired: "Accesso richiesto per generare GIF",
      gifGoToSettings: "Vai alle Impostazioni per Accedere",
    },
```

Replace with:

```ts
      gifAuthRequired: "Accesso richiesto per generare GIF",
      gifGoToSettings: "Vai alle Impostazioni per Accedere",
      modeSlider: "Slider",
      modeSideBySide: "Affiancate",
      modeGif: "GIF",
      modeGrid: "Griglia",
      modeSelect: "Seleziona foto",
    },
```

- [ ] **Step 5: Add German values**

`de.progress` currently ends with:

```ts
      gifAuthRequired: "Anmeldung erforderlich zum Erstellen von GIFs",
      gifGoToSettings: "Zu Einstellungen Gehen um sich Anzumelden",
    },
```

Replace with:

```ts
      gifAuthRequired: "Anmeldung erforderlich zum Erstellen von GIFs",
      gifGoToSettings: "Zu Einstellungen Gehen um sich Anzumelden",
      modeSlider: "Schieberegler",
      modeSideBySide: "Nebeneinander",
      modeGif: "GIF",
      modeGrid: "Raster",
      modeSelect: "Fotos auswählen",
    },
```

- [ ] **Step 6: Add French values**

`fr.progress` currently ends with:

```ts
      gifAuthRequired: "Connexion requise pour générer des GIF",
      gifGoToSettings: "Aller aux Paramètres pour se Connecter",
    },
```

Replace with:

```ts
      gifAuthRequired: "Connexion requise pour générer des GIF",
      gifGoToSettings: "Aller aux Paramètres pour se Connecter",
      modeSlider: "Curseur",
      modeSideBySide: "Côte à côte",
      modeGif: "GIF",
      modeGrid: "Grille",
      modeSelect: "Sélectionner des photos",
    },
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 8: Replace the icon-only mode switcher with labeled, scrollable pills**

In `components/progress/PhotoMorph.tsx`, the current mode switcher block reads:

```tsx
      {/* Comparison Mode Switcher */}
  <View style={styles.modeSwitcher}>
    <TouchableOpacity
      style={[
        styles.modeButton,
        { backgroundColor: comparisonMode === 'slider' ? theme.primary : theme.text + '20' }
      ]}
      onPress={() => setComparisonMode('slider')}
    >
      <Ionicons
        name="swap-horizontal-outline"
        size={18}
        color={comparisonMode === 'slider' ? theme.background : theme.text}
      />
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.modeButton,
        { backgroundColor: comparisonMode === 'sideBySide' ? theme.primary : theme.text + '20', opacity: hasSideBySideAccess ? 1 : 0.5 }
      ]}
      onPress={() => hasSideBySideAccess && setComparisonMode('sideBySide')}
      disabled={!hasSideBySideAccess}
    >
      <View style={styles.modeButtonContent}>
        <Ionicons
          name="copy-outline"
          size={18}
          color={comparisonMode === 'sideBySide' ? theme.background : theme.text}
        />
        {!hasSideBySideAccess && (
          <Ionicons name="lock-closed" size={10} color={theme.text} style={styles.lockIcon} />
        )}
      </View>
    </TouchableOpacity>
    {/* GIF mode as third tab */}
    <TouchableOpacity
      style={[
        styles.modeButton,
        { backgroundColor: comparisonMode === 'gif' ? theme.primary : theme.text + '20', opacity: hasGifAccess ? 1 : 0.5 }
      ]}
      onPress={() => hasGifAccess && setComparisonMode('gif')}
      disabled={!hasGifAccess}
    >
      <View style={styles.modeButtonContent}>
        <Ionicons name="film-outline" size={18} color={comparisonMode === 'gif' ? theme.background : theme.text} />
        {!hasGifAccess && (
          <Ionicons name="lock-closed" size={10} color={theme.text} style={styles.lockIcon} />
        )}
      </View>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.modeButton,
        { backgroundColor: comparisonMode === 'grid' ? theme.primary : theme.text + '20', opacity: hasGridViewAccess ? 1 : 0.5 }
      ]}
      onPress={() => hasGridViewAccess && setComparisonMode('grid')}
      disabled={!hasGridViewAccess}
    >
      <View style={styles.modeButtonContent}>
        <Ionicons
          name="grid-outline"
          size={18}
          color={comparisonMode === 'grid' ? theme.background : theme.text}
        />
        {!hasGridViewAccess && (
          <Ionicons name="lock-closed" size={10} color={theme.text} style={styles.lockIcon} />
        )}
      </View>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.modeButton, { backgroundColor: theme.cardBackground, opacity: hasCustomSelectionAccess ? 1 : 0.5 }]}
      onPress={() => hasCustomSelectionAccess && setIsSelectingPhotos(true)}
      disabled={!hasCustomSelectionAccess}
    >
      <View style={styles.modeButtonContent}>
        <Ionicons name="images-outline" size={18} color={theme.text} />
        {!hasCustomSelectionAccess && (
          <Ionicons name="lock-closed" size={10} color={theme.text} style={styles.lockIcon} />
        )}
      </View>
    </TouchableOpacity>
  </View>
```

Replace with:

```tsx
      {/* Comparison Mode Switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.modeSwitcher}
        contentContainerStyle={styles.modeSwitcherContent}
      >
        {[
          {
            key: 'slider' as const,
            icon: 'swap-horizontal-outline' as const,
            label: t('progress.modeSlider'),
            locked: false,
            onPress: () => setComparisonMode('slider'),
          },
          {
            key: 'sideBySide' as const,
            icon: 'copy-outline' as const,
            label: t('progress.modeSideBySide'),
            locked: !hasSideBySideAccess,
            onPress: () => hasSideBySideAccess && setComparisonMode('sideBySide'),
          },
          {
            key: 'gif' as const,
            icon: 'film-outline' as const,
            label: t('progress.modeGif'),
            locked: !hasGifAccess,
            onPress: () => hasGifAccess && setComparisonMode('gif'),
          },
          {
            key: 'grid' as const,
            icon: 'grid-outline' as const,
            label: t('progress.modeGrid'),
            locked: !hasGridViewAccess,
            onPress: () => hasGridViewAccess && setComparisonMode('grid'),
          },
          {
            key: 'select' as const,
            icon: 'images-outline' as const,
            label: t('progress.modeSelect'),
            locked: !hasCustomSelectionAccess,
            onPress: () => hasCustomSelectionAccess && setIsSelectingPhotos(true),
          },
        ].map((mode) => {
          const isActive = mode.key !== 'select' && comparisonMode === mode.key;
          return (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.modePill,
                { backgroundColor: isActive ? theme.primary : theme.text + '20' },
              ]}
              onPress={mode.onPress}
              disabled={mode.locked}
              activeOpacity={0.8}
            >
              <View style={styles.modeButtonContent}>
                <Ionicons
                  name={mode.icon}
                  size={16}
                  color={isActive ? theme.background : theme.text}
                />
                <Text
                  style={[
                    styles.modePillText,
                    { color: isActive ? theme.background : theme.text },
                  ]}
                >
                  {mode.label}
                </Text>
                {mode.locked && (
                  <Ionicons name="lock-closed" size={10} color={theme.text} style={styles.lockIcon} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
```

- [ ] **Step 9: Update the stylesheet**

In the same file's `StyleSheet.create` block, this section reads:

```tsx
  modeSwitcher: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  modeButton: {
    padding: 10,
    borderRadius: 8,
  },
  modeButtonContent: {
    position: 'relative',
  },
  lockIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
```

Replace with:

```tsx
  modeSwitcher: {
    marginBottom: 12,
  },
  modeSwitcherContent: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  modePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  modePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modeButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    position: 'relative',
  },
  lockIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
```

- [ ] **Step 10: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 11: Manual check**

Run: `npx expo start`, open Progress with 2+ photos of the same type. Confirm the mode switcher now shows labeled pills ("Slider", "Side-by-side", "GIF", "Grid", "Select photos") that scroll horizontally, the active pill is highlighted, and locked pills (GIF, Select photos — until Task 8 ungates side-by-side/grid, those still show locks too) show a small lock icon and are disabled.

- [ ] **Step 12: Commit**

```bash
git add localization/translations.ts components/progress/PhotoMorph.tsx
git commit -m "fix: replace unlabeled icon-only comparison mode switcher with labeled pills"
```

---

### Task 5: Build the SyncedZoomPair component

**Files:**
- Create: `components/progress/SyncedZoomPair.tsx`

**Interfaces:**
- Consumes: `useTheme()` from `@/context/ThemeContext`, `Colors` from `@/constants/Colors` (existing patterns, same as `PhotoMorph.tsx`).
- Produces: `SyncedZoomPair` React component with props `{ photoA: { uri: string; label: string }; photoB: { uri: string; label: string } }`. Consumed by Task 6.

- [ ] **Step 1: Create the component file**

Create `components/progress/SyncedZoomPair.tsx`:

```tsx
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface PhotoInfo {
  uri: string;
  label: string;
}

interface SyncedZoomPairProps {
  photoA: PhotoInfo;
  photoB: PhotoInfo;
}

const { width: screenWidth } = Dimensions.get("window");
const CONTAINER_PADDING = 40; // matches PhotoMorph's container padding (20 each side)
const PAIR_GAP = 10;
const PAIR_WIDTH = screenWidth - CONTAINER_PADDING;
const PHOTO_WIDTH = (PAIR_WIDTH - PAIR_GAP) / 2;
const PHOTO_HEIGHT = PHOTO_WIDTH * (4 / 3);
const MAX_SCALE = 4;
const MIN_SCALE = 1;

function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

export const SyncedZoomPair: React.FC<SyncedZoomPairProps> = ({ photoA, photoB }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const [swapped, setSwapped] = useState(false);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const maxTranslateX = ((scale.value - 1) * PHOTO_WIDTH) / 2;
      const maxTranslateY = ((scale.value - 1) * PHOTO_HEIGHT) / 2;
      translateX.value = clamp(
        savedTranslateX.value + event.translationX,
        -maxTranslateX,
        maxTranslateX
      );
      translateY.value = clamp(
        savedTranslateY.value + event.translationY,
        -maxTranslateY,
        maxTranslateY
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const resetZoom = () => {
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const left = swapped ? photoB : photoA;
  const right = swapped ? photoA : photoB;

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
          onPress={() => setSwapped((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-horizontal" size={16} color={theme.text} />
          <Text style={[styles.actionButtonText, { color: theme.text }]}>Swap</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
          onPress={resetZoom}
          activeOpacity={0.8}
        >
          <Ionicons name="scan-outline" size={16} color={theme.text} />
          <Text style={[styles.actionButtonText, { color: theme.text }]}>Reset zoom</Text>
        </TouchableOpacity>
      </View>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.pairRow}>
          <View style={[styles.photoWrapper, { borderColor: theme.primary }]}>
            <Animated.Image source={{ uri: left.uri }} style={[styles.photo, animatedStyle]} />
            <View style={[styles.label, { backgroundColor: theme.text + "B3" }]}>
              <Text style={styles.labelText} numberOfLines={1}>
                {left.label}
              </Text>
            </View>
          </View>
          <View style={[styles.photoWrapper, { borderColor: theme.primary }]}>
            <Animated.Image source={{ uri: right.uri }} style={[styles.photo, animatedStyle]} />
            <View style={[styles.label, { backgroundColor: theme.text + "B3" }]}>
              <Text style={styles.labelText} numberOfLines={1}>
                {right.label}
              </Text>
            </View>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pairRow: {
    flexDirection: "row",
    gap: PAIR_GAP,
  },
  photoWrapper: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 2,
  },
  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  label: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  labelText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default SyncedZoomPair;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. (This component isn't imported anywhere yet, so this only validates the file compiles standalone.)

- [ ] **Step 3: Commit**

```bash
git add components/progress/SyncedZoomPair.tsx
git commit -m "feat: add SyncedZoomPair component for synchronized pinch-zoom photo comparison"
```

---

### Task 6: Wire SyncedZoomPair into side-by-side mode, remove duplicate titles

**Files:**
- Modify: `components/progress/PhotoMorph.tsx`

**Interfaces:**
- Consumes: `SyncedZoomPair` from Task 5 (`{ photoA, photoB }` props as defined there).

- [ ] **Step 1: Import SyncedZoomPair**

In `components/progress/PhotoMorph.tsx`, find this existing import line:

```tsx
import { createBeforeAfterGif } from '@/services/gifService';
import { useRouter } from 'expo-router';
```

Replace with:

```tsx
import { createBeforeAfterGif } from '@/services/gifService';
import { useRouter } from 'expo-router';
import SyncedZoomPair from '@/components/progress/SyncedZoomPair';
```

- [ ] **Step 2: Replace the static side-by-side block with SyncedZoomPair**

The current side-by-side mode block reads:

```tsx
      {/* Side by Side Mode */}
      {comparisonMode === 'sideBySide' && (
        <FeatureGate
          feature={Feature.SIDE_BY_SIDE_COMPARISON}
          showPreview={false}
          compact={false}
          customMessage="Upgrade to Premium to compare photos side-by-side"
        >
          <View style={styles.sideBySideContainer}>
            <View style={[styles.sideBySidePhoto, { borderColor: theme.primary }]}>
              <Image source={{ uri: photo1.uri }} style={styles.image} />
              <View style={[styles.sideBySideLabel, { backgroundColor: theme.text + 'B3' }]}>
                <Text style={styles.sideBySideLabelText}>{t("common.before")}</Text>
                <Text style={styles.sideBySideDateText}>
                  {new Date(photo1.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            </View>
            <View style={[styles.sideBySidePhoto, { borderColor: theme.primary }]}>
              <Image source={{ uri: photo2.uri }} style={styles.image} />
              <View style={[styles.sideBySideLabel, { backgroundColor: theme.text + 'B3' }]}>
                <Text style={styles.sideBySideLabelText}>{t("common.after")}</Text>
                <Text style={styles.sideBySideDateText}>
                  {new Date(photo2.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            </View>
          </View>
        </FeatureGate>
      )}
```

Replace with:

```tsx
      {/* Side by Side Mode */}
      {comparisonMode === 'sideBySide' && (
        <FeatureGate
          feature={Feature.SIDE_BY_SIDE_COMPARISON}
          showPreview={false}
          compact={false}
          customMessage="Upgrade to Premium to compare photos side-by-side"
        >
          <SyncedZoomPair
            photoA={{
              uri: photo1.uri,
              label: `${t("common.before")} · ${new Date(photo1.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            }}
            photoB={{
              uri: photo2.uri,
              label: `${t("common.after")} · ${new Date(photo2.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            }}
          />
        </FeatureGate>
      )}
```

- [ ] **Step 3: Remove now-unused side-by-side styles**

In the same file's `StyleSheet.create` block, remove these now-dead entries (their only consumer was the block just replaced):

```tsx
  sideBySideContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  sideBySidePhoto: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 2,
  },
  sideBySideLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  sideBySideLabelText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  sideBySideDateText: {
    color: "white",
    fontSize: 11,
    opacity: 0.8,
    marginTop: 2,
  },
```

Delete this block entirely (no replacement — just remove it from the stylesheet).

- [ ] **Step 4: Remove the redundant title in the empty-state branch**

The current empty-state branch reads:

```tsx
  if (photos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.transparent }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t(`progress.${type}`)}
        </Text>
        <View
          style={[
            styles.noPhotosContainer,
            { backgroundColor: theme.transparent },
          ]}
        >
          <Ionicons name="image-outline" size={48} color={theme.text} />
          <Text style={[styles.noPhotosText, { color: theme.text }]}>
            {t("progress.noPhotosAvailable") + " " + t(`progress.${type}`)}
          </Text>
        </View>
  </View>
    );
  }
```

Replace with:

```tsx
  if (photos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.transparent }]}>
        <View
          style={[
            styles.noPhotosContainer,
            { backgroundColor: theme.transparent },
          ]}
        >
          <Ionicons name="image-outline" size={48} color={theme.text} />
          <Text style={[styles.noPhotosText, { color: theme.text }]}>
            {t("progress.noPhotosAvailable") + " " + t(`progress.${type}`)}
          </Text>
        </View>
      </View>
    );
  }
```

- [ ] **Step 5: Remove the redundant title in the single-photo branch**

Find this exact block (inside the `photos.length === 1` branch):

```tsx
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t(`progress.${type}`)}
          </Text>
          <View style={[styles.singlePhotoChip, { backgroundColor: theme.cardBackground }]}>
            <Ionicons name="image-outline" size={16} color={theme.text} />
            <Text style={[styles.singlePhotoChipText, { color: theme.text }]}>1 photo</Text>
          </View>
        </View>
```

Replace with:

```tsx
        <View style={[styles.headerRow, styles.headerRowSingle]}>
          <View style={[styles.singlePhotoChip, { backgroundColor: theme.cardBackground }]}>
            <Ionicons name="image-outline" size={16} color={theme.text} />
            <Text style={[styles.singlePhotoChipText, { color: theme.text }]}>1 photo</Text>
          </View>
        </View>
```

- [ ] **Step 6: Remove the redundant title in the main branch**

Find this exact block:

```tsx
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t(`progress.${type}`)}
        </Text>
        <View style={styles.headerActions}>
```

Replace with:

```tsx
      <View style={[styles.headerRow, styles.headerRowSingle]}>
        <View style={styles.headerActions}>
```

Then find the closing of that same header block, a few lines later:

```tsx
          <View
            style={[
              styles.timeDifferenceChip,
              { backgroundColor: theme.primary },
            ]}
          >
            <Ionicons name="time-outline" size={16} color={theme.background} />
            <Text style={[styles.timeDifferenceChipText, { color: theme.background }]}>
              {getTimeDifference(photo1.date, photo2.date, t)}
            </Text>
          </View>
        </View>
      </View>
```

This closing structure does not need to change — it already closes `headerActions` then the outer row `View`. Leave it as-is; only the opening tag changed in this step.

- [ ] **Step 7: Add the `headerRowSingle` style and remove the now-unused `title` style**

In the `StyleSheet.create` block, find:

```tsx
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
```

Replace with:

```tsx
  headerRowSingle: {
    justifyContent: "flex-end",
  },
```

(This removes the now-unused `title` style, since all three usages were deleted in Steps 4–6, and adds the new `headerRowSingle` style referenced by those same steps.)

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 9: Manual check**

Run: `npx expo start`, open Progress with 2+ photos, switch to Side-by-side mode. Confirm:
- Both photos render at roughly equal, larger size than before, each with a "Before · [date]" / "After · [date]" label.
- Pinching on either photo zooms both simultaneously to the same relative region.
- Dragging while zoomed pans both photos together.
- The "Swap" button flips which photo is on which side.
- The "Reset zoom" button returns both photos to scale 1.
- No duplicate "Front"/"Side"/"Back" title text appears above the photos in any of the empty/single-photo/main states.

- [ ] **Step 10: Commit**

```bash
git add components/progress/PhotoMorph.tsx
git commit -m "feat: use synced pinch-zoom for side-by-side comparison, remove redundant panel titles"
```

---

### Task 7: Progress screen tab-bar restructure

**Files:**
- Modify: `app/(tabs)/progress.tsx`

**Interfaces:**
- Consumes: `PhotoMorph` (unchanged props: `{ type: PhotoType }`), `PhotoType` enum from `@/enums/Photos` (`front`, `side`, `back`).

- [ ] **Step 1: Replace the stacked-panels layout with a tab bar + single panel**

The current file reads:

```tsx
import React from "react";
import { StyleSheet, ScrollView, View, RefreshControl } from "react-native";
import PhotoMorph from "@/components/progress/PhotoMorph";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import BackgroundImage from "@/components/style/BackgroundImage";
import { Header } from "@/components/home/Header";
import { usePhotos } from "@/context/PhotoContext";
import { useLocalization } from "@/context/LocalizationContext";
import { PhotoType } from "@/enums/Photos";

const ProgressScreen: React.FC = () => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { getLatestPhotoByType, refreshPhotos } = usePhotos();
  const { t } = useLocalization();
  const types = Object.values(PhotoType);

  return (
    <BackgroundImage blurIntensity={0} overlayOpacity={1}>
      <Header title={t("progress.title")} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.transparent },
        ]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refreshPhotos} />
        }
      >
        {types.map((type) => (
          <View
            key={type}
            style={[
              styles.morphContainer,
              { backgroundColor: theme.transparent },
            ]}
          >
            <PhotoMorph type={type} />
          </View>
        ))}
      </ScrollView>
    </BackgroundImage>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
  },
  statsContainer: {
    width: "100%",
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  statsText: {
    fontSize: 16,
    marginBottom: 5,
  },
  morphContainer: {
    width: "100%",
    marginBottom: 20,
  },
});

export default ProgressScreen;
```

Replace the entire file with:

```tsx
import React, { useState } from "react";
import { StyleSheet, ScrollView, View, RefreshControl, TouchableOpacity, Text } from "react-native";
import PhotoMorph from "@/components/progress/PhotoMorph";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import BackgroundImage from "@/components/style/BackgroundImage";
import { Header } from "@/components/home/Header";
import { usePhotos } from "@/context/PhotoContext";
import { useLocalization } from "@/context/LocalizationContext";
import { PhotoType } from "@/enums/Photos";

const ProgressScreen: React.FC = () => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { refreshPhotos } = usePhotos();
  const { t } = useLocalization();
  const types = Object.values(PhotoType);
  const [activeType, setActiveType] = useState<PhotoType>(PhotoType.front);

  return (
    <BackgroundImage blurIntensity={0} overlayOpacity={1}>
      <Header title={t("progress.title")} />
      <View style={styles.tabBar}>
        {types.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.tabButton,
              { backgroundColor: activeType === type ? theme.primary : theme.cardBackground },
            ]}
            onPress={() => setActiveType(type)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: activeType === type ? theme.background : theme.text },
              ]}
            >
              {t(`camera.${type}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.transparent },
        ]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refreshPhotos} />
        }
      >
        <View
          style={[
            styles.morphContainer,
            { backgroundColor: theme.transparent },
          ]}
        >
          <PhotoMorph type={activeType} />
        </View>
      </ScrollView>
    </BackgroundImage>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
  },
  morphContainer: {
    width: "100%",
    marginBottom: 20,
  },
});

export default ProgressScreen;
```

Note: `getLatestPhotoByType` was destructured from `usePhotos()` in the original file but never used anywhere in the component body — it's dropped here as dead code encountered directly on the line being edited. `statsContainer`/`statsText` styles were likewise unused in the original file and are dropped for the same reason.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Manual check**

Run: `npx expo start`, open the Progress tab. Confirm:
- A Front/Side/Back tab bar appears at the top, defaulting to "Front" selected.
- Tapping "Side" or "Back" swaps the panel below to show that type's photos, without needing to scroll past the other two types.
- Every comparison mode (Slider, Side-by-side, GIF, Grid) now has noticeably more vertical room than before.
- Pull-to-refresh still works.

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/progress.tsx"
git commit -m "fix: replace stacked front/side/back panels with a tab bar for more comparison space"
```

---

### Task 8: Ungate side-by-side and grid comparison for free tier

**Files:**
- Modify: `config/features.json`

**Interfaces:**
- Consumes: nothing new — `featureFlagService.hasFeatureAccess()` (existing, unchanged) already reads `requiredTier` from this file at runtime.
- Produces: `hasFeatureAccess(Feature.SIDE_BY_SIDE_COMPARISON)` and `hasFeatureAccess(Feature.GRID_VIEW_COMPARISON)` now return `true` for free-tier users. Consumed automatically by `PhotoMorph.tsx`'s `hasSideBySideAccess`/`hasGridViewAccess` checks (already reading `hasFeatureAccess` — no code change needed there) and `FeatureGate` (renders children directly once `hasFeatureAccess` is true).

- [ ] **Step 1: Ungate side-by-side comparison**

In `config/features.json`, find:

```json
    "side_by_side_comparison": {
      "key": "side_by_side_comparison",
      "category": "comparisons",
      "name": "Side-by-Side Comparison",
      "description": "Compare photos side-by-side with advanced controls",
      "requiredTier": "premium",
      "enabled": true,
```

Replace with:

```json
    "side_by_side_comparison": {
      "key": "side_by_side_comparison",
      "category": "comparisons",
      "name": "Side-by-Side Comparison",
      "description": "Compare photos side-by-side with advanced controls",
      "requiredTier": "free",
      "enabled": true,
```

- [ ] **Step 2: Ungate grid view comparison**

Find:

```json
    "grid_view_comparison": {
      "key": "grid_view_comparison",
      "category": "comparisons",
      "name": "Grid View Comparison",
      "description": "View multiple progress points in a grid layout",
      "requiredTier": "premium",
      "enabled": true,
```

Replace with:

```json
    "grid_view_comparison": {
      "key": "grid_view_comparison",
      "category": "comparisons",
      "name": "Grid View Comparison",
      "description": "View multiple progress points in a grid layout",
      "requiredTier": "free",
      "enabled": true,
```

- [ ] **Step 3: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('config/features.json', 'utf8')); console.log('valid')"`
Expected output: `valid`

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Manual check**

Run: `npx expo start`. In Settings, ensure "Test Premium" is **off** (free tier). Open Progress, switch to Side-by-side and Grid modes — confirm neither shows a lock icon or upgrade prompt anymore and both are fully usable. Switch to GIF mode and the "Select photos" pill — confirm those are still locked/premium-gated, unchanged.

- [ ] **Step 6: Commit**

```bash
git add config/features.json
git commit -m "feat: make side-by-side and grid comparison free for all users"
```

---

### Task 9: Full manual verification pass

**Files:** none (verification only)

**Interfaces:** none — this task exercises the combined behavior of Tasks 1–8.

- [ ] **Step 1: Full type-check**

Run: `npx tsc --noEmit`
Expected: no errors at all (clean, matching the pre-plan baseline).

- [ ] **Step 2: Start the app**

Run: `npx expo start`, open on a simulator/device (or web, understanding gesture-handler pinch behavior can't be verified on web — verify pinch/pan specifically on iOS/Android simulator or device).

- [ ] **Step 3: Walk the gallery delete flow**

- Take or import at least 3 photos of the same type via the Camera tab.
- In Gallery, delete one photo via the "×" button — confirm the alert appears and Cancel/Delete both work as expected.
- Enter selection mode, select 2 photos, bulk-delete — confirm the count in the alert message is correct and both Cancel/Delete work.

- [ ] **Step 4: Walk the progress screen**

- Open Progress — confirm the Front/Side/Back tab bar appears and switches panels correctly.
- On a type with 2+ photos, cycle through all mode pills (Slider, Side-by-side, GIF, Grid, Select photos) — confirm labels are legible, active state is clear, and locked pills (GIF, Select photos) show a lock icon and don't switch modes when tapped.
- In Side-by-side mode, confirm synced pinch-zoom/pan, Swap, and Reset zoom all work as described in Task 6.

- [ ] **Step 5: Walk the home screen**

- Confirm the stats card reads "X% consistency" (not "active").

- [ ] **Step 6: Confirm free-tier paywall behavior is otherwise unchanged**

- Confirm GIF generation and "Select photos" (custom photo selection) still show lock icons and open the paywall modal when tapped, with Test Premium off.
- Toggle Test Premium on in Settings, confirm GIF and Select-photos unlock, then toggle back off.

- [ ] **Step 7: Final commit (if any cleanup was needed)**

If verification surfaced no code changes, there is nothing to commit here — this task is a checkpoint, not a code change. If any fix was needed during verification, commit it with a message describing what was found and fixed.
