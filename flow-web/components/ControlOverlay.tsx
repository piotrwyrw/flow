import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {IconHome, IconPlus, IconTrash} from "@tabler/icons-react";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Item, ItemActions, ItemContent, ItemTitle} from "@/components/ui/item";
import Attractor, {AttractorMode, attractorModeDisplayName} from "@/lib/Attractor";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Label} from "@/components/ui/label";
import {Slider} from "@/components/ui/slider";
import React, {useEffect, useState} from "react";
import ParticleSystem from "@/lib/ParticleSystem";
import * as Three from 'three';
import {
    emptyFormModel,
    FormSchema,
    MutableFormModel,
    schemaSelectField,
    schemaUnboundedNumberField
} from "@/lib/DynamicForms";
import DynamicForm from "@/components/DynamicForm";

type ControlOverlayProps = {
    system: ParticleSystem
}

export default function ControlOverlay({system}: ControlOverlayProps) {
    const [particleCount, setParticleCount] = useState<number>(0)
    const [attractors, setAttractors] = useState<Attractor[]>([])

    const initialIntegrationTimeStep = 0.01
    const [integrationTimeStep, setIntegrationTimeStep] = useState<number[]>([initialIntegrationTimeStep])

    const initialIntegrationSubstepNumber = 1
    const [integrationSubstepNumber, setIntegrationSubstepNumber] = useState<number[]>([initialIntegrationSubstepNumber])

    const [newAttractorMode, setNewAttractorMode] = useState<string>("")

    system.registerAttractorListener(attractors => setAttractors([...attractors]))

    // Sync the initial state of the system and controls
    useEffect(() => {
        setParticleCount(system.particleCount)
        setAttractors(system.attractors)

        system.timeStep = integrationTimeStep[0]
        system.integrationSubsteps = integrationSubstepNumber[0]
    }, [system])

    useEffect(() => {
        system.timeStep = integrationTimeStep[0] || initialIntegrationTimeStep
    }, [integrationTimeStep]);

    useEffect(() => {
        system.integrationSubsteps = integrationSubstepNumber[0] || initialIntegrationSubstepNumber
    }, [integrationSubstepNumber]);

    // Attractor Creation
    const [attrXId, attrX] = schemaUnboundedNumberField("X Position", "attr_x")
    const [attrYId, attrY] = schemaUnboundedNumberField("Y Position", "attr_y")
    const [attrZId, attrZ] = schemaUnboundedNumberField("Z Position", "attr_z")
    const [attrStrengthId, attrStrength] = schemaUnboundedNumberField("Strength", "attr_strength")
    const [attrTypeId, attrType] = schemaSelectField<AttractorMode>("Type", "Attractor Type", Object.values(AttractorMode), "attr_type")

    const newAttractorSchema: FormSchema = [attrX, attrY, attrZ, attrStrength, attrType]
    const [newAttractorModel] = useState<MutableFormModel>(emptyFormModel())

    const [newAttractorFormValid, setNewAttractorFormValid] = useState<boolean>(false)

    const createAttractor = () => {
        const x = newAttractorModel.getNumber(attrXId)
        const y = newAttractorModel.getNumber(attrYId)
        const z = newAttractorModel.getNumber(attrZId)
        const strength = newAttractorModel.getNumber(attrStrengthId)
        const mode = newAttractorModel.getTextAs<AttractorMode>(attrTypeId)

        system.addAttractor(new Attractor(
            new Three.Vector3(x, y, z),
            strength,
            mode
        ))
    }

    const removeAttractor = (index: number) => {
        system.removeAttractor(index)
    }

    return (
        <div className="absolute top-0 left-0 w-full h-svh pointer-events-none">
            <Tabs defaultValue="home" className="px-10 py-5 pointer-events-none">
                <TabsList className="pointer-events-auto">
                    <TabsTrigger value="home"><IconHome/></TabsTrigger>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="attr">Attractors</TabsTrigger>
                    <TabsTrigger value="sim">Simulation Math</TabsTrigger>
                </TabsList>
                <TabsContent value="home"></TabsContent>
                <TabsContent value="overview">
                    <Card className="w-100">
                        <CardHeader>
                            <CardTitle>Overview</CardTitle>
                            <CardDescription>Simulation statistics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            Particle Count: {particleCount}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="attr">
                    <Card className="w-100">
                        <CardHeader>
                            <CardTitle>Attractors</CardTitle>
                            <CardDescription>List or manage attractors</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2">
                                {attractors.map(((attr, index) => (
                                    <Item variant="outline" key={index}>
                                        <ItemContent className="gap-1">
                                            <ItemTitle>Attractor {index + 1}</ItemTitle>
                                            <div className="grid grid-cols-3">
                                                <span className="col-span-2">Mode</span>
                                                <span
                                                    className="col-span-1 text-muted-foreground">{attractorModeDisplayName(attr.mode)}</span>
                                            </div>
                                            <div className="grid grid-cols-3">
                                                <span className="col-span-2">Strength</span>
                                                <span
                                                    className="col-span-1 text-muted-foreground">{attr.strength}</span>
                                            </div>
                                            <div className="grid grid-cols-3 whitespace-nowrap gap-2">
                                                <div className="overflow-hidden text-ellipsis">
                                                    <span>X</span>
                                                    <span className="text-muted-foreground">{attr.position.x}</span>
                                                </div>
                                                <div className="overflow-hidden text-ellipsis">
                                                    <span>Y</span>
                                                    <span className="text-muted-foreground">{attr.position.y}</span>
                                                </div>
                                                <div className="overflow-hidden text-ellipsis">
                                                    <span>Z</span>
                                                    <span className="text-muted-foreground">{attr.position.z}</span>
                                                </div>
                                            </div>
                                        </ItemContent>
                                        <ItemActions>
                                            <Button variant="destructive" size="icon"
                                                    onClick={() => {
                                                        removeAttractor(index)
                                                    }}>
                                                <IconTrash/>
                                            </Button>
                                        </ItemActions>
                                    </Item>
                                )))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button className="w-full" variant="outline" size="sm">
                                        <IconPlus/> New Attractor
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="leading-none font-medium">New Attractor</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Create a new particle attractor
                                            </p>
                                        </div>
                                        <DynamicForm schema={newAttractorSchema}
                                                     model={newAttractorModel}
                                                     onSubmit={createAttractor}
                                                     valid={setNewAttractorFormValid}>
                                            <Button type="submit" disabled={!newAttractorFormValid}>
                                                <IconPlus/> Create
                                            </Button>
                                        </DynamicForm>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="sim">
                    <Card className="w-100">
                        <CardHeader>
                            <CardTitle>Simulation</CardTitle>
                            <CardDescription>Tune Simulation Parameters</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Card className="w-full">
                                <CardHeader>
                                    <CardTitle>Simulation Timestep</CardTitle>
                                    <CardDescription>
                                        Simulation time every frame. Higher values produce faster moving particles,
                                        but may cause the system to diverge into chaos.
                                    </CardDescription>
                                    <CardContent>
                                        <div className="grid w-full gap-3 mt-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="timestep">Timestep</Label>
                                                <span className="text-muted-foreground">{integrationTimeStep}</span>
                                            </div>
                                            <Slider id="timestep" value={integrationTimeStep}
                                                    onValueChange={setIntegrationTimeStep}
                                                    min={0}
                                                    max={1}
                                                    step={0.01}>
                                            </Slider>
                                        </div>
                                    </CardContent>
                                </CardHeader>
                            </Card>
                            <Card className="w-full">
                                <CardHeader>
                                    <CardTitle>Motion Integration</CardTitle>
                                    <CardDescription>
                                        Controls how many integration steps are computed each frame.
                                        Just like the increasing the timestep, this setting speeds up or slows down
                                        the
                                        simulation. A higher amount of integration substeps results in a more stable
                                        system
                                        than a higher time step setting, but will slow down playback.
                                    </CardDescription>
                                    <CardContent>
                                        <div className="grid w-full gap-3 mt-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="steps">Integration Steps</Label>
                                                <span
                                                    className="text-muted-foreground">{integrationSubstepNumber}</span>
                                            </div>
                                            <Slider id="steps" value={integrationSubstepNumber}
                                                    onValueChange={setIntegrationSubstepNumber}
                                                    min={1}
                                                    max={50}
                                                    step={1}>
                                            </Slider>
                                        </div>
                                    </CardContent>
                                </CardHeader>
                            </Card>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}