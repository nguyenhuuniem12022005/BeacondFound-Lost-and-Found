import { Link } from 'react-router-dom';
import Icon from './Icons';
import { TypeBadge } from './common';
import { timeAgo, avatarOf } from '../utils/format';

export default function PostCard({ post }) {
  const cover = post.images?.[0]?.imageUrl;
  return (
    <Link
      to={`/posts/${post.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {cover ? (
          <img
            src={cover}
            alt={post.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">{Icon.camera('h-10 w-10')}</div>
        )}
        <div className="absolute left-2 top-2">
          <TypeBadge type={post.type} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-bold text-gray-900 group-hover:text-primary-700">{post.title}</h3>
        <p className="line-clamp-1 text-sm text-gray-500">{post.description}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {post.category && (
            <span className="rounded-md bg-primary-50 px-2 py-0.5 font-semibold text-primary-700">
              {post.category.name}
            </span>
          )}
          <span className="flex items-center gap-1 text-gray-400">
            {Icon.clock('h-3.5 w-3.5')} {timeAgo(post.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          {Icon.pin('h-3.5 w-3.5 text-primary-500')}
          <span className="line-clamp-1">{post.address}</span>
        </div>
        <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-3">
          <img src={avatarOf(post.user)} alt="" className="h-6 w-6 rounded-full object-cover" />
          <span className="text-xs font-medium text-gray-600">{post.user?.fullName}</span>
        </div>
      </div>
    </Link>
  );
}
