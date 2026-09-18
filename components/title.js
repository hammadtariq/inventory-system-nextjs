import { Typography } from "antd";
import { Children } from "react";

import styles from "@/styles/Title.module.css";

const { Title } = Typography;

export default function AppTitle({ children, action, toolbar, ...restProps }) {
  const childList = Children.toArray(children);
  const [title, ...legacyActions] = childList;
  const hasAction = Boolean(action);
  const hasToolbar = Boolean(toolbar);
  const hasLegacyActions = legacyActions.length > 0;

  if (!hasAction && !hasToolbar && !hasLegacyActions) {
    return (
      <div className={styles.titleBar}>
        <div className={styles.titleMainRow}>
          <Title {...restProps} className={styles.heading}>
            {title}
          </Title>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.titleBar}>
      <div className={styles.titleMainRow}>
        <Title {...restProps} className={styles.heading}>
          {title}
        </Title>
        {hasAction && <div className={styles.primaryAction}>{action}</div>}
      </div>
      {hasToolbar && <div className={styles.toolbar}>{toolbar}</div>}
      {!hasAction && !hasToolbar && hasLegacyActions && <div className={styles.actions}>{legacyActions}</div>}
    </div>
  );
}
