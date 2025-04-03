@echo off

echo If you see
echo "'python` is not recognized as an internal or external command"
echo then see the readme.txt for information to install Python.
echo.

rem Set the path to your Python executable


rem May need this if you don't want to change global env settings
rem set PATH=C:\python27;C:\Program files\GDAL;%PATH%
rem set GDAL_DATA=C:\Program files\GDAL\gdal-data

rem Use the specified Python executable
%PYTHON_PATH% startheron.py %*

pause
