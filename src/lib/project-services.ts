import type { EditorServices } from "#/builder/editor/context";
import { createUpload, deleteAsset, listAssets, registerAsset } from "#/server/assets";
import { republishSite, updateSiteSettings } from "#/server/site";

/**
 * Project-level services (assets and site settings). Shared by the editor
 * and by the project "Site" tab, which edit the same settings.
 */
export function projectServices(
  projectId: string,
): Pick<EditorServices, "listAssets" | "uploadAsset" | "deleteAsset" | "updateSiteSettings" | "republishSite"> {
  return {
    listAssets: () => listAssets({ data: { projectId } }),
    uploadAsset: async (file) => {
      const { uploadUrl, key } = await createUpload({
        data: { projectId, name: file.name, mimeType: file.type, size: file.size },
      });
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) throw new Error("Falha no envio do arquivo");
      return registerAsset({
        data: { projectId, key, name: file.name, mimeType: file.type, size: file.size },
      });
    },
    deleteAsset: (assetId) => deleteAsset({ data: { projectId, assetId } }),
    updateSiteSettings: (patch) => updateSiteSettings({ data: { projectId, ...patch } }),
    republishSite: () => republishSite({ data: { projectId } }),
  };
}
