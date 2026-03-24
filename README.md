# Pickleball Paddle Database

A beginner-friendly, fully static website for searching and comparing pickleball paddles.

- No command line required
- No install/build tools required
- Works on GitHub Pages
- Data is managed in Google Sheets

---

## Files in This Project

- `index.html` - Home page with search + filters
- `paddles.html` - All paddles page + category/brand/best/new views
- `paddle.html` - Single paddle detail page
- `compare.html` - Side-by-side comparison tool
- `finder.html` - Paddle recommendation quiz
- `pro-players.html` - Pro player paddle page
- `styles.css` - Site design/styles
- `script.js` - Main site logic
- `data.js` - Google Sheet settings (you will edit this)
- `starter-paddles.csv` - Starter dataset to upload to Google Sheets

---

## STEP 1 - Upload `starter-paddles.csv` to Google Sheets

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **Blank spreadsheet**
3. In the top menu, click **File > Import**
4. Click **Upload**
5. Select `starter-paddles.csv`
6. In import options, choose **Replace current sheet**
7. Click **Import data**

You now have your paddle database in Google Sheets.

---

## STEP 2 - Make the sheet public

1. Click the **Share** button (top-right)
2. Click **General access**
3. Change from **Restricted** to **Anyone with the link**
4. Set permission to **Viewer**
5. Click **Done**

---

## STEP 3 - Copy the Google Sheet ID

1. Open your sheet in the browser
2. Look at the URL. Example:

`https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/edit#gid=0`

3. The Sheet ID is the part between `/d/` and `/edit`

Example ID:
`1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`

---

## STEP 4 - Insert the Sheet ID into the website

1. Open `data.js`
2. Find this line:

```js
googleSheetId: "PASTE_YOUR_GOOGLE_SHEET_ID_HERE",
```

3. Replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` with your real Sheet ID
4. Save the file

---

## STEP 5 - Create a GitHub repository

1. Go to [GitHub](https://github.com)
2. Click the **+** icon (top-right) and choose **New repository**
3. Name it (example: `pickleball-paddle-database`)
4. Keep it **Public**
5. Click **Create repository**

---

## STEP 6 - Upload the files

1. In your new repository, click **uploading an existing file**
2. Drag and drop **all files** from this project folder
3. Scroll down and click **Commit changes**

---

## STEP 7 - Enable GitHub Pages

1. In your repository, click **Settings**
2. In the left menu, click **Pages**
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
4. Click **Save**
5. Wait about 1-3 minutes
6. Refresh the Pages settings screen and open your live site URL

---

## How to Add/Edit/Delete Paddles (No Coding)

Always do this in Google Sheets:

- Add a new row for a new paddle
- Edit cell values to update a paddle
- Delete a row to remove a paddle

Then refresh your website. The changes load automatically from your sheet.

Important: Keep the same column headers exactly as they are in `starter-paddles.csv`.

---

## Required Column Headers

Your sheet must include these columns in row 1:

`id, name, brand, weight_oz, surface_material, core_material, skill_level, paddle_type, image_url, description, pros, cons, affiliate_link, release_year`

---

## Example opensheet URL format

`https://opensheet.elk.sh/SPREADSHEET_ID/sheet1`

This project builds that URL automatically using your ID in `data.js`.

---

## Built-in Pages / Views

Main pages:

- Home (`index.html`)
- All Paddles (`paddles.html`)
- Paddle Detail (`paddle.html?slug=...`)
- Compare (`compare.html`)
- Finder Quiz (`finder.html`)
- Pro Players (`pro-players.html`)

SEO/category examples (all on `paddles.html`):

- `?view=best-beginners`
- `?view=best-control`
- `?view=best-power`
- `?view=best-lightweight`
- `?view=under-50`
- `?view=under-100`
- `?view=under-150`
- `?view=new-pickleball-paddles`
- plus custom programmatic views like `?view=selkirk-control-paddles`

---

## Notes

- This site uses affiliate links. Add your own links in the `affiliate_link` column.
- Product details include product schema markup for SEO.
- If your paddles do not appear, check:
  - Your Sheet is public
  - Your Sheet ID is correct in `data.js`
  - The sheet tab name is `sheet1` (or update `sheetName` in `data.js`)
