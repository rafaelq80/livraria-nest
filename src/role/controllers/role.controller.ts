import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseIntPipe,
	Post,
	Put,
	UseGuards,
} from "@nestjs/common"
import { Role } from "../entities/role.entity"
import { RoleService } from "../services/role.service"
import { Roles } from "../../security/decorators/roles.decorator"
import { JwtAuthGuard } from "../../security/guards/jwt-auth.guard"
import { RolesAuthGuard } from "../../security/guards/roles-auth.guard"
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger"

@ApiTags('Role')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesAuthGuard)
@Roles("admin") // Somente admnistradores possuem acesso
@Controller("/roles")
export class RoleController {

	constructor(private readonly roleService: RoleService) {}

	@Get()
	@HttpCode(HttpStatus.OK)
	findAll(): Promise<Role[]> {
		return this.roleService.findAll()
	}

	@Get("/:id")
	@HttpCode(HttpStatus.OK)
	findById(@Param("id", ParseIntPipe) id: number): Promise<Role> {
		return this.roleService.findById(id)
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	create(@Body() role: Role): Promise<Role> {
		return this.roleService.create(role)
	}

	@Put()
	@HttpCode(HttpStatus.OK)
	update(@Body() role: Role): Promise<Role> {
		return this.roleService.update(role)
	}

	@Delete("/:id")
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(@Param("id", ParseIntPipe) id: number) {
		return this.roleService.delete(id)
	}
}
