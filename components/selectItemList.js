import { memo } from "react";
import { Select } from "antd";

import { ITEMS_LIST } from "@/utils/ui.util";

const { Option } = Select;

export default memo(function SelectItemList({ selectItemListOnChange, ...props }) {
  return (
    <Select {...props} onChange={selectItemListOnChange}>
      {ITEMS_LIST.map((val) => (
        <Option key={val} value={val}>
          {val}
        </Option>
      ))}
    </Select>
  );
});
