# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wedding photo sharing application (fotobodas) built with Next.js 16. Guests can upload photos which are stored in Google Drive, and view a gallery of all shared photos with infinite scroll, lightbox viewing, and batch download.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
npm run get-token # Generate Google OAuth refresh token (interactive)
```

## Architecture

### Google Drive Integration

Photos are stored in Google Drive using OAuth 2.0 with a service account-style pattern:
- **Owner's refresh token** is used to authenticate all API calls (no per-user auth)
- Configure credentials in `.env.local` (see `.env.example`)
- Run `npm run get-token` to generate the refresh token interactively

The drive client is configured in `lib/google-drive.ts` and exports the authenticated `drive` instance.

### API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/upload` | Single photo upload with Sharp processing |
| `POST /api/upload/bulk` | Bulk upload (max 10 photos, parallel processing) |
| `GET /api/photos` | Paginated photo listing from Drive folder |
| `GET /api/image/[id]` | Image proxy with optional resize (?w=400) |

All uploads:
- Validate file type (JPEG, PNG, WebP, HEIC) and size (max 10MB)
- Process with Sharp: auto-rotate, resize to 2000px max, convert to JPEG
- Set files as publicly readable in Drive

### Frontend Components

- `components/upload/PhotoUploader.tsx` - Drag-and-drop uploader with react-dropzone, batch uploads
- `components/gallery/PhotoGallery.tsx` - Infinite scroll grid, lightbox, selection mode for batch download

### Styling

Uses Tailwind CSS v4 with custom CSS variables for fonts and colors. Three Google Fonts are loaded in `app/layout.tsx`:
- Playfair Display (headings)
- Cormorant Garamond (subheadings)
- Montserrat (body text)

Custom color palette: cream, beige, sand, taupe, charcoal, warm-gray, gold-accent.

### Key Dependencies

- `sharp` - Server-side image processing
- `googleapis` - Google Drive API client
- `framer-motion` - Animations
- `react-dropzone` - File upload UI
- `lucide-react` - Icons
