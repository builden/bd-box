import styles from './styles.module.scss';

type SwitchProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Switch = ({ className = '', ...props }: SwitchProps) => {
  return (
    <div className={`${styles.switchContainer} ${className}`}>
      <input className={styles.switchInput} type="checkbox" {...props} />
      <div className={styles.switchThumb}></div>
    </div>
  );
};
