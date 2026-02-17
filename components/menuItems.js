import { Menu, Tooltip } from "antd";

export default function AppMenuItems(props) {
  if (!props || typeof props !== "object") {
    console.error("Invalid props passed to AppMenuItems:", props);
    return null;
  }

  const { mode = "inline", items = [], onClickHandler, selected, collapsed = false } = props;

  return (
    <Menu
      theme="dark"
      mode={mode}
      selectedKeys={selected ? [selected] : []}
      style={{
        height: "76vh",
        borderRight: 0,
        overflowY: "auto",
        scrollbarWidth: "none",
        paddingTop: collapsed ? "5px" : "10px",
      }}
    >
      {Array.isArray(items) &&
        items.map((item) => (
          <Menu.Item
            key={item?.id}
            icon={item?.icon}
            onClick={() => onClickHandler?.(item?.url, item?.id)}
            style={{ paddingRight: "5px" }}
          >
            {collapsed ? (
              <Tooltip title={item?.title} placement="right">
                <span style={{ display: "inline-block", width: "100%" }}>{item?.title}</span>
              </Tooltip>
            ) : (
              item?.title
            )}
          </Menu.Item>
        ))}
    </Menu>
  );
}
