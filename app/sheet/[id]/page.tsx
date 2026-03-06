import SpreadsheetGrid from "@/components/SpreadsheetGrid";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function SheetPage({ params }: { params: { id: string } }) {
    return (
        <ProtectedRoute>
            <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "white" }}>
                <SpreadsheetGrid sheetId={params.id} />
            </div>
        </ProtectedRoute>
    );
}
