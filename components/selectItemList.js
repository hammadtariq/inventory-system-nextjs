import { Select, Alert } from "antd";

import { ITEMS_LIST } from "@/utils/ui.util";

const { Option } = Select;

export default function SelectItemList({ setSelectedListType, ...props }) {
  return (
    <Select {...props} onChange={setSelectedListType}>
      {ITEMS_LIST.map((val) => (
        <Option key={val} value={val}>
          {val}
        </Option>
      ))}
    </Select>
  );
}
