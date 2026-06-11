"use client";

import dynamic from "next/dynamic";
import type { DocumentSlice } from "@floorplanner/lib/persistence";

const EditorShell = dynamic(() => import("@floorplanner/components/editor/EditorShell"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[70vh] items-center justify-center bg-slate-200 text-sm text-slate-600">
      Loading editor...
    </div>
  ),
});

type FloorplanEditorPageProps = {
  cloudBasePath: string;
  initialCloudLayout?: {
    id: string;
    name: string;
    revision: number;
    data: DocumentSlice;
  } | null;
  showLabel: string;
  storageNamespace: string;
};

export function FloorplanEditorPage(props: FloorplanEditorPageProps) {
  return <EditorShell {...props} />;
}
