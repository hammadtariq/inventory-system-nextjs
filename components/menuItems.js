import { Menu, Tooltip } from "antd";

export default function AppMenuItems({ mode, items, onClickHandler, selected, collapsed = false }) {
  return (
    <Menu
      theme="dark"
      mode={mode}
      selectedKeys={[selected]}
      style={{
        height: "74vh",
        borderRight: 0,
        overflowY: "auto",
        scrollbarWidth: "none",
      }}
    >
      {items.map((item) => (
        <Menu.Item
          key={item.id}
          icon={item.icon}
          onClick={() => onClickHandler(item.url, item.id)}
          style={{ paddingRight: "5px" }}
        >
          {collapsed ? (
            <Tooltip title={item.title} placement="right">
              <span style={{ display: "inline-block", width: "100%" }}>{item.title}</span>
            </Tooltip>
          ) : (
            item.title
          )}
        </Menu.Item>
      ))}
    </Menu>
  );
}
