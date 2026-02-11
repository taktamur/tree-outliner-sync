/**
 * 確認ダイアログコンポーネント
 *
 * ユーザーに確認を求めるモーダルダイアログ。
 * alert()やconfirm()の代わりに使用し、モダンなUIを提供する。
 */
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  /** ダイアログのタイトル */
  title: string;
  /** ダイアログのメッセージ */
  message: string;
  /** 確認ボタンのラベル（デフォルト: "OK"） */
  confirmLabel?: string;
  /** キャンセルボタンのラベル（デフォルト: "キャンセル"） */
  cancelLabel?: string;
  /** 確認ボタンがクリックされたときのコールバック */
  onConfirm: () => void;
  /** キャンセルボタンがクリックされたときのコールバック */
  onCancel: () => void;
}

/**
 * 確認ダイアログコンポーネント
 */
const ConfirmDialog = ({
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'キャンセル',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog-content" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-buttons">
          <button className="confirm-dialog-btn confirm-dialog-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="confirm-dialog-btn confirm-dialog-btn-confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
