import binaryExtensions from "binary-extensions";

const binaryExtensionSet = new Set(binaryExtensions.map((extension) => extension.toLowerCase()));

function getPathBasename(filePath: string): string {
	const normalizedPath = filePath.replaceAll("\\", "/");
	const separatorIndex = normalizedPath.lastIndexOf("/");
	return separatorIndex >= 0 ? normalizedPath.slice(separatorIndex + 1) : normalizedPath;
}

export function isBinaryFilePath(filePath: string): boolean {
	const basename = getPathBasename(filePath);
	const dotIndex = basename.lastIndexOf(".");
	if (dotIndex < 0 || dotIndex === basename.length - 1) {
		return false;
	}
	return binaryExtensionSet.has(basename.slice(dotIndex + 1).toLowerCase());
}

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"]);

export function isImageFilePath(filePath: string): boolean {
	const basename = getPathBasename(filePath);
	const dotIndex = basename.lastIndexOf(".");
	if (dotIndex < 0 || dotIndex === basename.length - 1) {
		return false;
	}
	return IMAGE_EXTENSIONS.has(basename.slice(dotIndex + 1).toLowerCase());
}
