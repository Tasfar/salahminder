Add-Type -AssemblyName System.Drawing

function Create-Icon ($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Background - Emerald Green
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 27, 94, 32))
    $g.FillRectangle($brush, 0, 0, $size, $size)
    
    # Text - Crescent/Star or Name
    $font = New-Object System.Drawing.Font "Arial", ($size / 4), [System.Drawing.FontStyle]::Bold
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 213, 79)) # Gold
    
    # Draw "SM" for SalahMinder
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $g.DrawString("SM", $font, $textBrush, ($size / 2), ($size / 2), $format)
    
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $brush.Dispose()
    $textBrush.Dispose()
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created $path"
}

Create-Icon 192 "public/icon-192.png"
Create-Icon 512 "public/icon-512.png"
