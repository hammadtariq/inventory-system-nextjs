import { Select, Alert } from "antd";

import { ITEMS_LIST } from "@/utils/ui.util";

const { Option } = Select;

export default function SelectItemList({ setSelectedListType }) {
  return (
    <Select onChange={setSelectedListType}>
      {ITEMS_LIST.map((val) => (
        <Option key={val} value={val}>
          {val}
        </Option>
      ))}
    </Select>
  );
}
