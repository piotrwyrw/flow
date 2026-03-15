'use client'

import React, {useEffect, useRef, useState} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {IconHome, IconPlus, IconTrash} from "@tabler/icons-react";
import useRenderer from "@/hooks/useRenderer";
import Attractor, {AttractorMode, attractorModeDisplayName} from "@/simulation/Attractor";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Label} from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {Vector3} from "three";
import {Slider} from "@/components/ui/slider";
import {Item, ItemActions, ItemContent, ItemTitle} from "@/components/ui/item";

export default function Page() {
    const commandSubmit = (e: React.KeyboardEvent) => {
        if (e.key == 'Enter') {
            const inputElement = (e.target as HTMLInputElement)
            window.dispatchEvent(new CustomEvent('command', {detail: inputElement.value}))
            inputElement.value = ''
        }
    }

    const [particleCount, setParticleCount] = useState<number>(0)
    const [attractors, setAttractors] = useState<Attractor[]>([])

    const [attractorMode, setAttractorMode] = useState<string>("")
    const [timeStep, setTimeStep] = useState<number[]>([0.01])
    const [integrationSteps, setIntegrationSteps] = useState<number[]>([2])

    const rendererRef = useRef<HTMLDivElement>(null)
    const system = useRenderer(rendererRef)

    useEffect(() => {
        if (!system.current) return

        setParticleCount(system.current.particleCount)
        setAttractors(system.current.attractors)

        system.current?.registerAttractorListener(a => {
            setAttractors([...a])
        })

        system.current.timeStep = timeStep[0]
        system.current.integrationSubsteps = integrationSteps[0]
    }, [system])

    useEffect(() => {
        if (!system.current) return

        const step = timeStep
        if (step.length != 1) system.current.timeStep = 0.1

        system.current.timeStep = step[0]
    }, [timeStep]);

    useEffect(() => {
        if (!system.current) return

        const steps = integrationSteps
        if (steps.length != 1) system.current.integrationSubsteps = 1

        system.current.integrationSubsteps = steps[0]
    }, [integrationSteps]);

    function addAttractor(x: number, y: number, z: number, strength: number, mode: AttractorMode) {
        system.current?.addAttractor(new Attractor(
            new Vector3(x, y, z),
            strength,
            mode
        ))
    }

    function removeAttractor(index: number) {
        system.current?.removeAttractor(index)
    }

    return (
        <>
            {/* -- Main viewport -- */}
            <div className="w-full h-svh z-10 pointer-events-auto">
                <div ref={rendererRef} className="w-full h-full"></div>
            </div>

            {/* -- Management Overlay --*/}
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
                                            <form onSubmit={(e) => {
                                                e.preventDefault()

                                                const data = new FormData(e.target)
                                                const x = Number(data.get("x"))
                                                const y = Number(data.get("y"))
                                                const z = Number(data.get("z"))
                                                const strength = Number(data.get("strength"))
                                                const mode = attractorMode as AttractorMode

                                                addAttractor(x, y, z, strength, mode)
                                            }}>
                                                <div className="grid gap-2">
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label htmlFor="x">X Position</Label>
                                                        <Input name="x" id="x" type="number" defaultValue={0}
                                                               className="col-span-2 h-8"/>
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label htmlFor="y">Y Position</Label>
                                                        <Input name="y" id="y" type="number" defaultValue={0}
                                                               className="col-span-2 h-8"/>
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label htmlFor="z">Z Position</Label>
                                                        <Input name="z" id="z" type="number" defaultValue={0}
                                                               className="col-span-2 h-8"/>
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label htmlFor="strength">Strength</Label>
                                                        <Input name="strength" id="strength" type="number"
                                                               defaultValue={1}
                                                               className="col-span-2 h-8"/>
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label htmlFor="mode">Mode</Label>
                                                        <Select value={attractorMode} onValueChange={setAttractorMode}>
                                                            <SelectTrigger className="w-full col-span-2 h-8 max-w-48">
                                                                <SelectValue placeholder="Attractor Mode"/>
                                                            </SelectTrigger>
                                                            <SelectContent position="item-aligned">
                                                                <SelectGroup>
                                                                    <SelectLabel>Attractor Mode</SelectLabel>
                                                                    <SelectItem value="constant">Constant</SelectItem>
                                                                    <SelectItem value="linear">Linear</SelectItem>
                                                                    <SelectItem value="inverse_square">
                                                                        Inverse Square
                                                                    </SelectItem>
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button className="w-full" variant="outline" size="sm"
                                                            type="submit" disabled={attractorMode == ""}>
                                                        <IconPlus/> Create
                                                    </Button>
                                                </div>
                                            </form>
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
                                                    <span className="text-muted-foreground">{timeStep}</span>
                                                </div>
                                                <Slider id="timestep" value={timeStep}
                                                        onValueChange={setTimeStep}
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
                                                    <span className="text-muted-foreground">{integrationSteps}</span>
                                                </div>
                                                <Slider id="steps" value={integrationSteps}
                                                        onValueChange={setIntegrationSteps}
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

            <div
                className="absolute bottom-0 left-0 w-full h-svh flex flex-col items-center justify-end z-0 pointer-events-none">
                <div className="flex flex-row items-center justify-center w-full h-9 mb-5 gap-1">
                    <Input className="w-1/2 h-full font-mono pointer-events-auto" placeholder="Enter Command"
                           onKeyDown={commandSubmit}></Input>
                    <Button className="h-full pointer-events-auto">Palette</Button>
                </div>
            </div>
        </>
    )
}