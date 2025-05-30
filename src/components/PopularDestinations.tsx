import React from 'react';
import { ExternalLink } from 'lucide-react';
import useFetchUsers from '@/hooks/useFetchUsers';

const PopularDestinations: React.FC = () => {
	const { users, loading, error } = useFetchUsers();
	const destinations = [
		{
			id: 1,
			name: 'Bali',
			country: 'Indonesia',
			image: 'https://example.com/bali.jpg',
		},
		{
			id: 2,
			name: 'Paris',
			country: 'France',
			image: 'https://example.com/paris.jpg',
		},
		{
			id: 3,
			name: 'Tokyo',
			country: 'Japan',
			image: 'https://example.com/tokyo.jpg',
		},
	];

	if (loading) return <div>Loading users...</div>;
	if (error) return <div>Error: {error}</div>;

	return (
		<div className="bg-white rounded-lg p-4 shadow-md">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-lg font-semibold">Popular Destinations</h3>
				<a
					href="#"
					className="text-primary text-sm flex items-center hover:underline"
				>
					View all <ExternalLink className="ml-1 h-3 w-3" />
				</a>
			</div>

			<div className="grid grid-cols-2 gap-3">
				{destinations.map((destination) => (
					<a
						key={destination.id}
						href="#"
						className="group relative rounded-lg overflow-hidden h-24"
					>
						<img
							src={destination.image}
							alt={destination.name}
							className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
						<div className="absolute bottom-2 left-2 text-white">
							<div className="font-medium text-sm">{destination.name}</div>
							<div className="text-xs opacity-80">
								{destination.country}
							</div>
						</div>
					</a>
				))}
			</div>

			<div className="mt-4">
				<h2 className="text-md font-semibold mb-2">Users</h2>
				<ul className="text-sm">
					{users?.map((user) => (
						<li key={user.user_id} className="mb-1">
							{user.name} ({user.email})
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

export default PopularDestinations;
