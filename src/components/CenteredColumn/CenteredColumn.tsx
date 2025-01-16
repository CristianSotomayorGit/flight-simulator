import React, { ReactNode } from 'react';
import styles from './CenteredColumn.module.css';

type CenteredColumnProps = {
  children?: ReactNode;
};

const CenteredColumn: React.FC<CenteredColumnProps> = ({ children }) => {
  return <div className={styles.centeredColumn}>{children}</div>;
};

export default CenteredColumn;
