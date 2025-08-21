import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Role {
  User = 'user',
  Admin = 'admin',
  CopyWriter = 'copyWriter',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop()
  firstName: string;
  @Prop()
  lastName: string;
  @Prop({ unique: true, type: String, required: true })
  mobile: string;

  @Prop()
  password: string;

  @Prop()
  role: Role;

  @Prop()
  code: string;
}

export const userSchema = SchemaFactory.createForClass(User);
