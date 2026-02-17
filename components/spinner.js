import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

export default function Spinner() {
  return (
    <div>
      <div className="app_spinner">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </div>
    </div>
  );
}
