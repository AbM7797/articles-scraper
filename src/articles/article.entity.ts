import {
  Table,
  Column,
  Model,
  DataType,
  Index,
  Unique,
} from 'sequelize-typescript';

@Table({
  tableName: 'articles',
  timestamps: true,
  indexes: [
    // Composite index across existing columns
    {
      name: 'idx_source_publication_date',
      fields: ['source', 'publication_date'],
    },
  ],
})
export class Article extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  @Index('idx_title')
  title: string;

  @Unique('url_unique')
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  url: string;

  @Index('idx_publication_date')
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  publication_date: Date;

  @Index('idx_source')
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  source: string;
}
