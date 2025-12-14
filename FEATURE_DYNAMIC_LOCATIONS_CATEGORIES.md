# Dynamic Locations & Categories Feature

## Áttekintés

Ez a funkció dinamikus helyszín (location) és kategória (category) kezelést ad hozzá az alkalmazáshoz. Az adminisztrátorok mostantól a webes felületen keresztül tudják kezelni a lokációkat és kategóriákat, nem szükséges kódmódosítás.

## Branch információk

- **Branch neve**: `feature/dynamic-locations-categories`
- **Alap branch**: `copilot-v1`
- **Commit**: `1419f63`

## Új funkciók

### 1. **Settings Admin Panel** 🎛️

Új admin oldal a helyszínek és kategóriák kezeléséhez:

- **Elérés**: Sidebar → Settings (csak admin felhasználóknak látható)
- **Két fül**: 
  - Locations: Tárolási helyszínek kezelése
  - Categories: Tárgy kategóriák kezelése

#### Funkciók:
- ✅ **Lista megjelenítés**: Összes lokáció/kategória táblázatban
- ✅ **Hozzáadás**: Új lokáció/kategória létrehozása névvel és leírással
- ✅ **Szerkesztés**: Meglévő lokáció/kategória módosítása
- ✅ **Aktiválás/Deaktiválás**: Soft delete - nem törlődnek véglegesen, csak inaktívvá válnak
- ✅ **Státusz jelzés**: Active/Inactive badge-ek
- ✅ **Időbélyegek**: Létrehozás dátuma

### 2. **Dinamikus Dropdown-ok** 📋

Az item form-ban a location és category mezők mostantól dropdown-ok:

**Előtte** (text input):
```html
<input type="text" id="itemLocation" required>
<input type="text" id="itemCategory" required>
```

**Utána** (dinamikus select):
```html
<select id="itemLocation" required>
  <option value="">Select a location...</option>
  <!-- Dinamikusan betöltve Firestore-ból -->
</select>
<select id="itemCategory" required>
  <option value="">Select a category...</option>
  <!-- Dinamikusan betöltve Firestore-ból -->
</select>
```

### 3. **Firestore Integráció** 🔥

Két új collection a Firestore-ban:

#### `locations` Collection
```typescript
{
  _id: string,
  name: string,              // pl. "Office - Desk 5"
  description?: string,      // opcionális leírás
  createdAt: Date,
  updatedAt: Date,
  isActive: boolean
}
```

#### `categories` Collection
```typescript
{
  _id: string,
  name: string,              // pl. "Electronics"
  description?: string,      // opcionális leírás
  createdAt: Date,
  updatedAt: Date,
  isActive: boolean
}
```

## Technikai részletek

### Módosított fájlok

1. **`src/types/models.ts`**
   - Új `Location` interface
   - Új `Category` interface
   - `Item` interface frissítve (category mező hozzáadva)

2. **`src/services/firestore.service.ts`**
   - `getLocations(includeInactive?)` - Location-ök lekérdezése
   - `createLocation(location)` - Új location létrehozása
   - `updateLocation(id, updates)` - Location módosítása
   - `deleteLocation(id)` - Location deaktiválása
   - `getCategories(includeInactive?)` - Category-k lekérdezése
   - `createCategory(category)` - Új category létrehozása
   - `updateCategory(id, updates)` - Category módosítása
   - `deleteCategory(id)` - Category deaktiválása

3. **`src/components/settings.component.ts`** (ÚJ FÁJL)
   - Teljes Settings admin panel
   - Tab-ek: Locations és Categories
   - CRUD műveletek mindkét típushoz
   - Bootstrap Toast notifikációk
   - Inline szerkesztés modal-okkal

4. **`src/components/dashboard.component.ts`**
   - `loadLocations()` - Location-ök betöltése
   - `loadCategories()` - Category-k betöltése
   - `populateLocationDropdown()` - Location dropdown feltöltése
   - `populateCategoryDropdown()` - Category dropdown feltöltése
   - Item form location/category mezők típusa frissítve (HTMLSelectElement)

5. **`src/main.ts`**
   - Settings view routing hozzáadva
   - `navigate()` és `loadView()` frissítve settings támogatással
   - Settings link láthatósága beállítva (csak admin)

6. **`index.html`**
   - Settings sidebar link hozzáadva
   - Location Modal hozzáadva (add/edit)
   - Category Modal hozzáadva (add/edit)
   - Item form dropdowns helyettesítik a text input-okat

### TypeScript típusjavítások

- ✅ `LoanStatus` enum használata string literálok helyett
- ✅ `availableQuantity` mező eltávolítva (nem része az Item interface-nek)
- ✅ `authService` import javítva settings.component-ben
- ✅ Loan `createLoan` típus frissítve (`status` automatikusan beállítva)

## Használati útmutató

### Admin számára

#### 1. Új Location hozzáadása
1. Navigálj a **Settings** oldalra (sidebar)
2. **Locations** fülön kattints az **"Add Location"** gombra
3. Töltsd ki a nevet (pl. "Storage Room A")
4. Opcionálisan adj hozzá leírást
5. Kattints **"Save Location"**

#### 2. Location szerkesztése
1. Settings → Locations fül
2. Kattints a **ceruza ikonra** a szerkesztendő location mellett
3. Módosítsd az adatokat
4. Kattints **"Save Location"**

#### 3. Location deaktiválása
1. Settings → Locations fül
2. Kattints a **kuka ikonra** a deaktiválandó location mellett
3. Erősítsd meg a műveletet

> **Megjegyzés**: Deaktivált location-ök nem jelennek meg az item form dropdown-jában, de továbbra is láthatók a Settings oldalon "Inactive" státusszal.

#### 4. Category kezelés
A Category-k kezelése ugyanúgy működik, mint a Location-öké:
- Add Category gomb
- Edit (ceruza ikon)
- Deactivate/Activate (kuka/visszaállítás ikon)

### Felhasználó számára

Amikor item-et adsz hozzá vagy szerkesztesz:
1. A **Location** mező dropdown-ként jelenik meg
2. A **Category** mező dropdown-ként jelenik meg
3. Válassz a listából (csak aktív location-ök/category-k jelennek meg)

## Adatbázis setup

### Firestore indexek

A Settings oldal működéséhez szükséges indexek:

```
Collection: locations
- name (Ascending)
- isActive (Ascending) + name (Ascending) [composite]

Collection: categories
- name (Ascending)
- isActive (Ascending) + name (Ascending) [composite]
```

Ezek automatikusan létrejönnek az első lekérdezéskor, vagy manuálisan létrehozhatók a Firebase Console-ban.

### Kezdeti adatok betöltése (opcionális)

Ha vannak meglévő item-ek text-alapú location/category mezőkkel, ajánlott:

1. Exportálni az egyedi location/category értékeket
2. Létrehozni őket a Settings oldalon
3. Frissíteni a meglévő item-eket (nem kötelező, mert a dropdown megjeleníti a meglévő értékeket is)

## Jövőbeli fejlesztési lehetőségek

- 🔄 **Bulk import**: CSV/JSON import location-ökhöz és category-khoz
- 📊 **Használati statisztika**: Hány item tartozik egy location-höz/category-hez
- 🎨 **Színkódolás**: Custom színek category-khoz
- 🔍 **Keresés és szűrés**: Settings oldalon keresés location/category név alapján
- 🗂️ **Hierarchia**: Alhelyszínek és alkategóriák (pl. Office > Desk 5)
- 🔒 **Validáció**: Törlés letiltása, ha aktív item használja
- 📤 **Export**: Location/category lista exportálása

## Tesztelési checklist

- [x] ✅ Settings oldal megjelenik admin felhasználónak
- [x] ✅ Settings link nem jelenik meg normál felhasználónak
- [x] ✅ Location hozzáadása működik
- [x] ✅ Location szerkesztése működik
- [x] ✅ Location deaktiválása működik
- [x] ✅ Location aktiválása működik
- [x] ✅ Category CRUD műveletek működnek
- [x] ✅ Item form location dropdown betöltődik
- [x] ✅ Item form category dropdown betöltődik
- [x] ✅ Item hozzáadása új dropdown-okkal működik
- [x] ✅ Item szerkesztése új dropdown-okkal működik
- [x] ✅ Toast notifikációk megjelennek
- [x] ✅ TypeScript fordítás hibátlan

## Migráció előző verzióról

Ha frissítesz egy korábbi verzióról:

1. **Firestore Security Rules frissítése**:
   ```javascript
   // Engedélyezd a locations és categories collection-öket
   match /locations/{locationId} {
     allow read: if request.auth != null;
     allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
   }
   
   match /categories/{categoryId} {
     allow read: if request.auth != null;
     allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
   }
   ```

2. **Branch merge**:
   ```bash
   git checkout main
   git merge feature/dynamic-locations-categories
   ```

3. **Deploy**:
   ```bash
   npm run build
   npm run deploy
   ```

## Kapcsolódó dokumentumok

- [README.md](./README.md) - Főoldal dokumentáció
- [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md) - Firestore setup útmutató
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architektúra áttekintés

## Changelog

### [1.1.0] - 2025-12-14

#### Added
- Settings admin panel lokációk és kategóriák kezeléséhez
- Location és Category Firestore collections
- Dinamikus dropdown-ok az item form-ban
- CRUD műveletek location-ökhöz és category-khoz
- Settings routing és navigáció

#### Changed
- Item form location és category mezők text-ről select-re
- Dashboard most betölti a location-öket és category-ket
- Item interface category mező hozzáadva

#### Fixed
- TypeScript típushibák javítva
- LoanStatus enum használata konzisztensen
- Import hibák javítva

---

**Készítette**: GitHub Copilot  
**Dátum**: 2025. december 14.  
**Verzió**: 1.1.0
