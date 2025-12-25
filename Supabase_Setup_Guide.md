# Supabase Setup Guide for InSync

## Overview
This guide explains how to configure Supabase for storing and retrieving images and GIFs in the InSync ISL learning application.

## Setup Steps

### 1. Create a Supabase Project
- Go to [supabase.com](https://supabase.com) and create an account
- Create a new project
- Note down the Project URL and anon key from Project Settings > API

### 2. Create Storage Bucket
- Go to Storage section in your Supabase dashboard
- Create a new bucket named `isl-assets` (or update the bucket name in `src/utils/imageStorage.ts`)
- Configure bucket policies to allow public read access:
  ```sql
  -- Allow public read access to all files in the bucket
  CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'isl-assets');
  ```

### 3. Upload Your Assets
- Upload your alphabet images to `alphabets/` folder in the bucket
- Upload your GIFs to `gifs/` folder in the bucket
- File names should match exactly what's expected by the application (A.png, B.png, ..., Z.png for alphabets and the same names as in the original files)

### 4. Environment Configuration
- Copy `.env.example` to `.env`
- Update the values with your Supabase project URL and anon key

### 5. Run the Application
- Install dependencies: `npm install`
- Start the development server: `npm run dev`

## Configuration

### Environment Variables
Create a `.env` file in the root directory with the following variables:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Storage Structure
The application expects the following folder structure in your Supabase storage bucket:
```
isl-assets/
├── alphabets/
│   ├── A.png
│   ├── B.png
│   ├── ...
│   └── Z.png
└── gifs/
    ├── Tree.mp4
    ├── Happy.mp4
    ├── ...
    └── [other gif files]
```

## Troubleshooting

- **Images not loading**: Check that your Supabase URL and anon key are correct in the environment variables
- **Permission errors**: Ensure the storage bucket policies allow public read access
- **File not found**: Verify that file names match exactly what the application expects

## API Functions

The application uses the following utility functions from `src/utils/imageStorage.ts`:

- `getImageUrl(fileName)`: Gets a signed URL for a single image
- `getImageUrls(fileNames)`: Gets signed URLs for multiple images in batch
- `uploadImage(file, fileName, folder)`: Uploads an image to Supabase storage
- `listFiles(folderPath)`: Lists all files in a specific folder
- `deleteImage(fileName)`: Deletes an image from Supabase storage

## Security Considerations

- The application uses signed URLs that expire after 1 hour for security
- Only public read access is required for the storage bucket
- No write operations are performed by default - these would require additional authentication

## Performance Optimization

- Images are loaded in batches to reduce API calls
- Fallback URLs are provided for when Supabase images are not available
- Loading states are implemented to provide user feedback during image fetching
