import { Button } from '../Button';

// =============================================================================
// 测试组件：用户卡片
// Props 丰富：id, name, email, avatar, role, onEdit, onDelete
// =============================================================================
export interface UserCardProps {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user' | 'guest';
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function UserCard({ id, name, email, avatar, role, onEdit, onDelete }: UserCardProps) {
  return (
    <div className="card" data-testid={`user-card-${id}`}>
      <div className="flex items-center gap-3">
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full" />
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
        <span className="ml-auto px-2 py-1 text-xs bg-blue-100 rounded">{role}</span>
      </div>
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={() => onEdit(id)}>
          编辑
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onDelete(id)}>
          删除
        </Button>
      </div>
    </div>
  );
}
