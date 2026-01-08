import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { Public } from '../decorators/public.decorator';

@Controller('images')
@Public()
export class ImagesController {
  @Get('products/:filename')
  async serveProductImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const path = `products/${filename}`;
    return this.serveImage(path, res);
  }

  @Get('*')
  async serveImage(@Param('0') path: string, @Res() res: Response) {
    // Map /images/products/product13.webp to /files/products/product13.webp
    // path will be like "products/product13.webp"

    if (!path) {
      return res.status(404).json({ message: 'Image path not provided' });
    }

    const pathParts = path.split('/');
    const filename = pathParts[pathParts.length - 1];
    const folder = pathParts[0]; // e.g., "products"

    // Try different possible paths
    const possiblePaths = [
      // Try /files/products/product13.webp (symlink path)
      join(process.cwd(), 'files', 'products', filename),
      // Try /files/product/main/product13.webp
      join(
        process.cwd(),
        'files',
        folder === 'products' ? 'product' : folder,
        'main',
        filename,
      ),
      // Try /files/product/resized/product13.webp
      join(
        process.cwd(),
        'files',
        folder === 'products' ? 'product' : folder,
        'resized',
        filename,
      ),
      // Try /files/product/product13.webp
      join(
        process.cwd(),
        'files',
        folder === 'products' ? 'product' : folder,
        filename,
      ),
      // Also try direct path mapping
      join(process.cwd(), 'files', ...pathParts),
    ];

    for (const filePath of possiblePaths) {
      if (existsSync(filePath)) {
        return res.sendFile(filePath, {
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
          },
        });
      }
    }

    // Fallback: If filename is like "product13.webp", try to find any file in the folder
    if (folder === 'products' || folder === 'product') {
      const filesDir = join(process.cwd(), 'files', 'product', 'main');
      if (existsSync(filesDir)) {
        const fs = require('fs');
        try {
          const files = fs.readdirSync(filesDir);
          if (files.length > 0) {
            // Use first available file as fallback
            const fallbackPath = join(filesDir, files[0]);
            if (existsSync(fallbackPath)) {
              return res.sendFile(fallbackPath, {
                headers: {
                  'Content-Type': 'image/webp',
                  'Cache-Control': 'public, max-age=31536000',
                },
              });
            }
          }
        } catch (error) {
          // Ignore file system errors
        }
      }
    }

    // If not found, return 404
    return res
      .status(404)
      .json({ message: 'Image not found', folder, filename });
  }
}
