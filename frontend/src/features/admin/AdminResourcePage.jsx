import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import Input from "@/components/common/Input";
import AdminDataTable from "./AdminDataTable";
import AdminPageHeader from "./AdminPageHeader";
import { adminResources } from "./adminResourceConfig";

export default function AdminResourcePage({ resource }) {
  const [searchTerm, setSearchTerm] = useState("");
  const config = adminResources[resource];

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return config.data;
    }

    return config.data.filter((row) => {
      return Object.values(row).join(" ").toLowerCase().includes(normalizedSearch);
    });
  }, [config.data, searchTerm]);

  return (
    <div className="flex min-w-0 flex-col gap-stack-md">
      <AdminPageHeader action={config.action} description={config.description} title={config.title} />
      <Input
        icon={Search}
        label="Tìm kiếm"
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder={config.searchPlaceholder}
        type="search"
        value={searchTerm}
      />
      {filteredRows.length > 0 ? (
        <AdminDataTable columns={config.columns} rows={filteredRows} />
      ) : (
        <EmptyState
          description="Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra lại bộ dữ liệu."
          title="Không có dữ liệu phù hợp"
        />
      )}
    </div>
  );
}
