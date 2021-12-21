import { Typography } from "antd";

const { Title } = Typography;

export default function AppTitle({ children, ...restProps }) {
  return <Title {...restProps}>{children}</Title>;
}
